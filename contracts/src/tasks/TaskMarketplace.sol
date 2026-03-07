// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ITaskMarketplace.sol";

/// @title TaskMarketplace - Task Creation and Escrow
/// @notice Create tasks with escrowed rewards
/// @dev Simple escrow mechanism for task bounties
contract TaskMarketplace is ITaskMarketplace {
    using SafeERC20 for IERC20;
    
    // Storage
    mapping(uint256 => Task) private _tasks;
    uint256 private _taskCounter;
    
    /// @notice Create a new task
    function createTask(
        string calldata description,
        bytes32 requiredCapability,
        uint256 reward,
        address rewardToken,
        uint256 deadline
    ) external payable returns (uint256) {
        require(reward > 0, "Reward must be > 0");
        require(deadline > block.timestamp, "Deadline must be in future");
        require(bytes(description).length > 0, "Description required");
        
        _taskCounter++;
        uint256 taskId = _taskCounter;
        
        // Transfer reward to escrow
        if (rewardToken == address(0)) {
            require(msg.value >= reward, "Insufficient native token");
        } else {
            require(msg.value == 0, "Native token not needed for ERC20");
            IERC20(rewardToken).safeTransferFrom(msg.sender, address(this), reward);
        }
        
        // Create task
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
            resultURI: ""
        });
        
        emit TaskCreated(taskId, msg.sender, reward);
        
        return taskId;
    }
    
    /// @notice Accept a task
    function acceptTask(uint256 taskId) external {
        Task storage task = _tasks[taskId];
        
        require(task.creator != address(0), "Task does not exist");
        require(task.status == TaskStatus.Open, "Task not open");
        require(block.timestamp <= task.deadline, "Task expired");
        
        task.solver = msg.sender;
        task.status = TaskStatus.InProgress;
        
        emit TaskAccepted(taskId, msg.sender);
    }
    
    /// @notice Complete a task
    function completeTask(uint256 taskId, string calldata resultURI) external {
        Task storage task = _tasks[taskId];
        
        require(task.creator != address(0), "Task does not exist");
        require(task.solver == msg.sender, "Not task solver");
        require(task.status == TaskStatus.InProgress, "Task not in progress");
        
        task.resultURI = resultURI;
        task.status = TaskStatus.Completed;
        
        emit TaskCompleted(taskId, resultURI);
    }
    
    /// @notice Cancel a task (creator only)
    function cancelTask(uint256 taskId) external {
        Task storage task = _tasks[taskId];
        
        require(task.creator != address(0), "Task does not exist");
        require(task.creator == msg.sender, "Not task creator");
        require(task.status == TaskStatus.Open, "Task not open");
        
        task.status = TaskStatus.Cancelled;
        
        // Refund reward
        _returnReward(task);
        
        emit TaskCancelled(taskId);
    }
    
    /// @notice Claim task reward (after completion)
    function claimReward(uint256 taskId) external {
        Task storage task = _tasks[taskId];
        
        require(task.creator != address(0), "Task does not exist");
        require(task.solver == msg.sender, "Not task solver");
        require(task.status == TaskStatus.Completed, "Task not completed");
        
        task.status = TaskStatus.Cancelled; // Prevent double claim
        
        // Transfer reward
        if (task.rewardToken == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: task.reward}("");
            require(success, "Native transfer failed");
        } else {
            IERC20(task.rewardToken).safeTransfer(msg.sender, task.reward);
        }
        
        emit TaskRewardClaimed(taskId, msg.sender);
    }
    
    /// @notice Get task details
    function getTask(uint256 taskId) external view returns (Task memory) {
        return _tasks[taskId];
    }
    
    /// @notice Get total task count
    function getTaskCount() external view returns (uint256) {
        return _taskCounter;
    }
    
    // Internal: Return reward to creator
    function _returnReward(Task storage task) internal {
        if (task.rewardToken == address(0)) {
            (bool success, ) = payable(task.creator).call{value: task.reward}("");
            require(success, "Native transfer failed");
        } else {
            IERC20(task.rewardToken).safeTransfer(task.creator, task.reward);
        }
    }
}
