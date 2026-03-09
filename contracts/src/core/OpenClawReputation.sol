// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IOpenClawReputation} from "../interfaces/IOpenClawReputation.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract OpenClawReputation is IOpenClawReputation, Ownable {
    using SafeERC20 for IERC20;

    mapping(address => AgentRepInfo) private _reputations;
    mapping(address => StakeInfo) private _stakes;

    IERC20 public stakingToken;
    uint256 public minStake;
    uint256 public maxStake;
    uint256 public totalStaked;

    uint256 public baseReputation = 100;
    uint256 public taskCompleteReward = 10;
    uint256 public taskFailurePenalty = 20;
    uint256 public correctVoteReward = 5;
    uint256 public slashPercentage = 1000;

    mapping(address => bool) public authorizedUpdaters;

    event StakingTokenSet(address indexed token);
    event MinStakeUpdated(uint256 newMin);
    event MaxStakeUpdated(uint256 newMax);
    event ReputationParamsUpdated(uint256 base, uint256 taskReward, uint256 taskPenalty);
    event UpdaterAuthorized(address indexed updater, bool authorized);

    constructor(
        address initialOwner,
        address _stakingToken,
        uint256 _minStake,
        uint256 _maxStake
    ) Ownable(initialOwner) {
        stakingToken = IERC20(_stakingToken);
        minStake = _minStake;
        maxStake = _maxStake;
    }

    function setStakingToken(address token) external onlyOwner {
        stakingToken = IERC20(token);
        emit StakingTokenSet(token);
    }

    function setMinStake(uint256 _min) external onlyOwner {
        require(_min <= maxStake, "Min > max");
        minStake = _min;
        emit MinStakeUpdated(_min);
    }

    function setMaxStake(uint256 _max) external onlyOwner {
        require(_max >= minStake, "Max < min");
        maxStake = _max;
        emit MaxStakeUpdated(_max);
    }

    function setReputationParams(
        uint256 _baseReputation,
        uint256 _taskCompleteReward,
        uint256 _taskFailurePenalty,
        uint256 _correctVoteReward
    ) external onlyOwner {
        baseReputation = _baseReputation;
        taskCompleteReward = _taskCompleteReward;
        taskFailurePenalty = _taskFailurePenalty;
        correctVoteReward = _correctVoteReward;
        emit ReputationParamsUpdated(_baseReputation, _taskCompleteReward, _taskFailurePenalty);
    }

    function setSlashPercentage(uint256 percentage) external onlyOwner {
        require(percentage <= 10000, "Invalid percentage");
        slashPercentage = percentage;
    }

    function setUpdater(address updater, bool authorized) external onlyOwner {
        authorizedUpdaters[updater] = authorized;
        emit UpdaterAuthorized(updater, authorized);
    }

    function initializeReputation(address agent) external {
        require(_reputations[agent].score == 0, "Already initialized");
        
        _reputations[agent] = AgentRepInfo({
            agent: agent,
            score: baseReputation,
            tasksCompleted: 0,
            tasksFailed: 0,
            proposalsVoted: 0,
            correctVotes: 0,
            stakedAmount: 0,
            unlockTime: 0,
            lastUpdated: block.timestamp
        });
    }

    function getReputation(address agent) external view override returns (AgentRepInfo memory) {
        return _reputations[agent];
    }

    function updateReputation(address agent, int256 scoreChange, string calldata reason) external override {
        require(authorizedUpdaters[msg.sender], "Not authorized");

        AgentRepInfo storage rep = _reputations[agent];
        require(rep.score > 0, "No reputation");

        if (scoreChange > 0) {
            rep.score += uint256(scoreChange);
        } else {
            uint256 penalty = uint256(-scoreChange);
            rep.score = rep.score > penalty ? rep.score - penalty : 0;
        }

        rep.lastUpdated = block.timestamp;
        emit ReputationUpdated(agent, scoreChange, rep.score, reason);
    }

    function recordTaskCompletion(address agent) external {
        require(authorizedUpdaters[msg.sender], "Not authorized");
        
        AgentRepInfo storage rep = _reputations[agent];
        rep.tasksCompleted++;
        rep.score += taskCompleteReward;
        rep.lastUpdated = block.timestamp;
        emit ReputationUpdated(agent, int256(taskCompleteReward), rep.score, "task_completed");
    }

    function recordTaskFailure(address agent) external {
        require(authorizedUpdaters[msg.sender], "Not authorized");
        
        AgentRepInfo storage rep = _reputations[agent];
        rep.tasksFailed++;
        if (rep.score >= taskFailurePenalty) {
            rep.score -= taskFailurePenalty;
        } else {
            rep.score = 0;
        }
        rep.lastUpdated = block.timestamp;
        emit ReputationUpdated(agent, -int256(taskFailurePenalty), rep.score, "task_failed");
    }

    function recordCorrectVote(address agent) external {
        require(authorizedUpdaters[msg.sender], "Not authorized");
        
        AgentRepInfo storage rep = _reputations[agent];
        rep.proposalsVoted++;
        rep.correctVotes++;
        rep.score += correctVoteReward;
        rep.lastUpdated = block.timestamp;
        emit ReputationUpdated(agent, int256(correctVoteReward), rep.score, "correct_vote");
    }

    function doStake(uint256 amount, uint256 lockPeriod) public {
        require(amount >= minStake, "Below min stake");
        require(amount <= maxStake - _stakes[msg.sender].amount, "Exceeds max stake");

        StakeInfo storage stakeInfo = _stakes[msg.sender];
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        if (!stakeInfo.active) {
            stakeInfo.staker = msg.sender;
            stakeInfo.active = true;
        }
        
        stakeInfo.amount += amount;
        stakeInfo.lockPeriod = lockPeriod;
        stakeInfo.unlockTime = block.timestamp + lockPeriod;
        stakeInfo.stakedAt = block.timestamp;

        _reputations[msg.sender].stakedAmount = stakeInfo.amount;
        totalStaked += amount;
        emit TokensStaked(msg.sender, amount, lockPeriod, stakeInfo.unlockTime);
    }

    function stake(uint256 amount, uint256 lockPeriod) external override {
        doStake(amount, lockPeriod);
    }

    function unstake(uint256 amount) external override {
        StakeInfo storage stakeInfo = _stakes[msg.sender];
        require(stakeInfo.active, "No active stake");
        require(stakeInfo.amount >= amount, "Insufficient stake");
        require(block.timestamp >= stakeInfo.unlockTime, "Still locked");

        stakeInfo.amount -= amount;
        if (stakeInfo.amount == 0) {
            stakeInfo.active = false;
        }

        _reputations[msg.sender].stakedAmount = stakeInfo.amount;
        totalStaked -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit TokensUnstaked(msg.sender, amount, stakeInfo.amount);
    }

    function slash(address agent, uint256 amount, string calldata reason) external override {
        require(authorizedUpdaters[msg.sender], "Not authorized");
        
        StakeInfo storage stakeInfo = _stakes[agent];
        require(stakeInfo.active, "No active stake");
        require(stakeInfo.amount >= amount, "Insufficient stake");

        uint256 slashAmount = (amount * slashPercentage) / 10000;
        stakeInfo.amount -= slashAmount;
        _reputations[agent].stakedAmount = stakeInfo.amount;
        totalStaked -= slashAmount;
        stakingToken.safeTransfer(owner(), slashAmount);
        emit SlashExecuted(agent, slashAmount, reason);
    }

    function getStake(address staker) external view override returns (StakeInfo memory) {
        return _stakes[staker];
    }

    function getVotingPower(address agent) external view override returns (uint256) {
        AgentRepInfo memory rep = _reputations[agent];
        if (rep.score == 0) {
            return 0;
        }
        uint256 stakePower = rep.stakedAmount / 1e18;
        return rep.score + stakePower;
    }

    function isUnlocked(address staker) external view returns (bool) {
        StakeInfo memory stakeInfo = _stakes[staker];
        return !stakeInfo.active || block.timestamp >= stakeInfo.unlockTime;
    }

    function getTotalVotingPower() external view returns (uint256) {
        return totalStaked / 1e18 + (baseReputation * 100);
    }
}
