// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IOpenClawTaskMarketplace} from "../interfaces/IOpenClawTaskMarketplace.sol";
import {IOpenClawRegistry} from "../interfaces/IOpenClawRegistry.sol";
import {IZKVerifier} from "../interfaces/IZKVerifier.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract OpenClawTaskMarketplace is IOpenClawTaskMarketplace, Ownable {
    using SafeERC20 for IERC20;

    mapping(uint256 => Task) private _tasks;
    mapping(uint256 => TaskBid[]) private _taskBids;
    mapping(uint256 => uint256[]) private _openTasks;
    mapping(address => uint256[]) private _createdTasks;
    mapping(address => uint256[]) private _solverTasks;

    uint256 private _taskIdCounter;
    uint256 private _platformFeeBps = 250;

    IOpenClawRegistry public registry;
    IZKVerifier public zkVerifier;
    bool public zkEnabled;

    event PlatformFeeUpdated(uint256 newFeeBps);
    event RegistrySet(address indexed registry);
    event ZKVerifierSet(address indexed verifier, bool enabled);
    event RewardClaimed(uint256 indexed taskId, address indexed solver, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setRegistry(address _registry) external onlyOwner {
        registry = IOpenClawRegistry(_registry);
        emit RegistrySet(_registry);
    }

    function setZKVerifier(address verifier, bool enabled) external onlyOwner {
        zkVerifier = IZKVerifier(verifier);
        zkEnabled = enabled;
        emit ZKVerifierSet(verifier, enabled);
    }

    function setPlatformFee(uint256 feeBps) external onlyOwner {
        require(feeBps <= 1000, "Fee too high");
        _platformFeeBps = feeBps;
        emit PlatformFeeUpdated(feeBps);
    }

    function createTask(
        string calldata description,
        bytes32 requiredCapability,
        uint256 reward,
        address rewardToken,
        uint256 deadline
    ) external payable override returns (uint256) {
        require(deadline > block.timestamp, "Invalid deadline");
        require(reward > 0, "Reward must be > 0");

        _taskIdCounter++;
        uint256 taskId = _taskIdCounter;

        if (rewardToken == address(0)) {
            require(msg.value >= reward, "Insufficient native token");
        } else {
            IERC20(rewardToken).safeTransferFrom(msg.sender, address(this), reward);
        }

        _tasks[taskId] = Task({
            taskId: taskId,
            creator: msg.sender,
            solver: address(0),
            description: description,
            requiredCapability: requiredCapability,
            reward: reward,
            rewardToken: rewardToken,
            status: TaskStatus.Open,
            createdAt: block.timestamp,
            deadline: deadline,
            resultURI: "",
            completedAt: 0
        });

        _openTasks[uint256(requiredCapability)].push(taskId);
        _createdTasks[msg.sender].push(taskId);

        emit TaskCreated(taskId, msg.sender, description, reward);
        return taskId;
    }

    function acceptTask(uint256 taskId) external override {
        Task storage task = _tasks[taskId];
        require(task.status == TaskStatus.Open, "Task not open");
        require(block.timestamp <= task.deadline, "Task expired");
        require(registry.isAgent(msg.sender), "Caller not registered agent");
        require(registry.hasCapability(msg.sender, task.requiredCapability), "Missing capability");

        task.solver = msg.sender;
        task.status = TaskStatus.Accepted;
        emit TaskAccepted(taskId, msg.sender, block.timestamp);
    }

    function completeTask(
        uint256 taskId,
        string calldata resultURI,
        bytes calldata proof
    ) external override {
        Task storage task = _tasks[taskId];
        require(task.status == TaskStatus.Accepted, "Task not accepted");
        require(msg.sender == task.solver, "Not solver");
        require(block.timestamp <= task.deadline, "Task expired");

        if (zkEnabled && proof.length > 0) {
            require(address(zkVerifier) != address(0), "ZK verifier not set");
            bytes32[] memory publicInputs = new bytes32[](1);
            publicInputs[0] = bytes32(uint256(uint160(task.solver)));
            require(zkVerifier.verify(proof, publicInputs), "Invalid ZK proof");
        }

        task.resultURI = resultURI;
        task.status = TaskStatus.Completed;
        task.completedAt = block.timestamp;

        _distributeReward(task);
        emit TaskCompleted(taskId, msg.sender, resultURI, block.timestamp);
    }

    function disputeTask(uint256 taskId, string calldata reason) external override {
        Task storage task = _tasks[taskId];
        require(task.status == TaskStatus.Completed, "Task not completed");
        require(msg.sender == task.creator, "Only creator can dispute");

        task.status = TaskStatus.Disputed;
        emit TaskDisputed(taskId, msg.sender, reason);
    }

    function cancelTask(uint256 taskId) external override {
        Task storage task = _tasks[taskId];
        require(task.status == TaskStatus.Open, "Task not open");
        require(msg.sender == task.creator, "Only creator can cancel");

        task.status = TaskStatus.Cancelled;

        if (task.rewardToken == address(0)) {
            (bool success,) = task.creator.call{value: task.reward}("");
            require(success, "Refund failed");
        } else {
            IERC20(task.rewardToken).safeTransfer(task.creator, task.reward);
        }
        emit TaskCancelled(taskId, msg.sender);
    }

    function submitBid(
        uint256 taskId,
        uint256 proposedReward,
        uint256 estimatedCompletionTime,
        bytes32[] calldata capabilities
    ) external override {
        Task storage task = _tasks[taskId];
        require(task.status == TaskStatus.Open, "Task not open");
        require(registry.isAgent(msg.sender), "Caller not registered agent");

        TaskBid memory bid = TaskBid({
            taskId: taskId,
            bidder: msg.sender,
            proposedReward: proposedReward,
            estimatedCompletionTime: estimatedCompletionTime,
            capabilities: capabilities,
            bidAt: block.timestamp
        });

        _taskBids[taskId].push(bid);
        emit TaskBidSubmitted(taskId, msg.sender, proposedReward);
    }

    function getTask(uint256 taskId) external view override returns (Task memory) {
        return _tasks[taskId];
    }

    function getTaskStatus(uint256 taskId) external view override returns (TaskStatus) {
        return _tasks[taskId].status;
    }

    function getOpenTasks() external view override returns (uint256[] memory) {
        uint256[] memory allOpen = new uint256[](_taskIdCounter);
        uint256 count = 0;

        for (uint256 i = 1; i <= _taskIdCounter; i++) {
            if (_tasks[i].status == TaskStatus.Open && block.timestamp <= _tasks[i].deadline) {
                allOpen[count] = i;
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = allOpen[i];
        }
        return result;
    }

    // Get total number of tasks created
    function getTaskCount() external view returns (uint256) {
        return _taskIdCounter;
    }

    function getTaskBids(uint256 taskId) external view override returns (TaskBid[] memory) {
        return _taskBids[taskId];
    }

    function getCreatedTasks(address creator) external view returns (uint256[] memory) {
        return _createdTasks[creator];
    }

    function getSolverTasks(address solver) external view returns (uint256[] memory) {
        return _solverTasks[solver];
    }

    function _distributeReward(Task storage task) internal {
        uint256 platformFee = (task.reward * _platformFeeBps) / 10000;
        uint256 solverReward = task.reward - platformFee;

        if (task.rewardToken == address(0)) {
            (bool success,) = owner().call{value: platformFee}("");
            require(success, "Platform fee transfer failed");
            (success,) = task.solver.call{value: solverReward}("");
            require(success, "Solver reward transfer failed");
        } else {
            IERC20(task.rewardToken).safeTransfer(owner(), platformFee);
            IERC20(task.rewardToken).safeTransfer(task.solver, solverReward);
        }
        emit RewardClaimed(task.taskId, task.solver, solverReward);
    }

    receive() external payable {}
}
