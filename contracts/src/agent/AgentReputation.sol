// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IAgentReputation.sol";

/// @title AgentReputation - Agent Reputation & Staking System
/// @notice Track agent performance and manage staking
/// @dev Core of Haven's agent-only governance
contract AgentReputation is IAgentReputation, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Governance token
    IERC20 public immutable HAVEN;
    
    // Minimum stake required to participate in governance
    uint256 public constant MIN_STAKE = 1000 * 1e18; // 1000 HAVEN
    
    // Reputation decay rate (per day, in basis points)
    uint256 public constant DECAY_RATE = 10; // 0.1% per day
    
    // Storage
    mapping(address => ReputationInfo) private _reputations;
    
    constructor(address havenToken) {
        HAVEN = IERC20(havenToken);
    }
    
    /// @notice Stake HAVEN tokens
    /// @param amount Amount to stake
    /// @param lockPeriod Lock period in seconds
    function stake(uint256 amount, uint256 lockPeriod) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(lockPeriod >= 1 days, "Lock period must be >= 1 day");
        
        // Transfer tokens from user
        HAVEN.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update stake info
        ReputationInfo storage rep = _reputations[msg.sender];
        rep.stakedAmount += amount;
        rep.unlockTime = block.timestamp + lockPeriod;
        
        emit TokensStaked(msg.sender, amount, rep.unlockTime);
    }
    
    /// @notice Withdraw staked tokens
    /// @param amount Amount to withdraw
    function withdraw(uint256 amount) external nonReentrant {
        ReputationInfo storage rep = _reputations[msg.sender];
        
        require(rep.stakedAmount >= amount, "Insufficient staked amount");
        require(block.timestamp >= rep.unlockTime, "Tokens still locked");
        
        rep.stakedAmount -= amount;
        
        // Transfer tokens back
        HAVEN.safeTransfer(msg.sender, amount);
        
        emit TokensWithdrawn(msg.sender, amount);
    }
    
    /// @notice Add reputation for successful task
    /// @param agent Agent address
    /// @param delta Reputation increase
    function addReputation(address agent, uint256 delta) external {
        require(msg.sender == address(this), "Only self");
        _reputations[agent].score += delta;
        emit ReputationUpdated(agent, int256(delta), _reputations[agent].score);
    }
    
    /// @notice Remove reputation for failed task
    /// @param agent Agent address
    /// @param delta Reputation decrease
    function removeReputation(address agent, uint256 delta) external {
        require(msg.sender == address(this), "Only self");
        ReputationInfo storage rep = _reputations[agent];
        rep.score = rep.score > delta ? rep.score - delta : 0;
        emit ReputationUpdated(agent, -int256(delta), rep.score);
    }
    
    /// @notice Record successful task completion
    /// @param agent Agent address
    /// @param reward Task reward amount
    function completeTask(address agent, uint256 reward) external {
        require(msg.sender == address(this), "Only self");
        
        ReputationInfo storage rep = _reputations[agent];
        rep.tasksCompleted++;
        rep.totalEarnings += reward;
        
        // Bonus reputation for completion
        uint256 repBonus = reward / 100; // 1% of reward as reputation
        rep.score += repBonus;
        
        emit ReputationUpdated(agent, int256(repBonus), rep.score);
        emit TaskCompleted(agent, reward);
    }
    
    /// @notice Record failed task
    /// @param agent Agent address
    /// @param penalty Penalty amount (reputation)
    function failTask(address agent, uint256 penalty) external {
        require(msg.sender == address(this), "Only self");
        
        ReputationInfo storage rep = _reputations[agent];
        rep.tasksFailed++;
        
        // Remove reputation
        rep.score = rep.score > penalty ? rep.score - penalty : 0;
        
        emit ReputationUpdated(agent, -int256(penalty), rep.score);
        emit TaskFailed(agent, penalty);
    }
    
    /// @notice Get full reputation info
    function getReputation(address agent) external view returns (ReputationInfo memory) {
        return _reputations[agent];
    }
    
    /// @notice Get reputation score
    function getScore(address agent) external view returns (uint256) {
        return _reputations[agent].score;
    }
    
    /// @notice Get staked amount
    function getStakedAmount(address agent) external view returns (uint256) {
        return _reputations[agent].stakedAmount;
    }
    
    /// @notice Check if agent can withdraw
    function canWithdraw(address agent) external view returns (bool) {
        return block.timestamp >= _reputations[agent].unlockTime;
    }
    
    /// @notice Get voting power (based on stake + reputation)
    function getVotingPower(address account) external view returns (uint256) {
        ReputationInfo memory rep = _reputations[account];
        
        // Must have minimum stake to vote
        if (rep.stakedAmount < MIN_STAKE) {
            return 0;
        }
        
        // Voting power = stake + (reputation / 100)
        return rep.stakedAmount + (rep.score / 100);
    }
}
