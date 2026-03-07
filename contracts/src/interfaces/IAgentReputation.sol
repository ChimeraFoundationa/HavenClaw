// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IAgentReputation - Agent Reputation Interface
/// @notice Track agent reputation and performance
interface IAgentReputation {
    // Structs
    struct ReputationInfo {
        uint256 score;
        uint256 tasksCompleted;
        uint256 tasksFailed;
        uint256 totalEarnings;
        uint256 stakedAmount;
        uint256 unlockTime;
    }
    
    // Events
    event ReputationUpdated(address indexed agent, int256 delta, uint256 newScore);
    event TokensStaked(address indexed agent, uint256 amount, uint256 unlockTime);
    event TokensWithdrawn(address indexed agent, uint256 amount);
    event TaskCompleted(address indexed agent, uint256 reward);
    event TaskFailed(address indexed agent, uint256 penalty);
    
    // Staking Functions
    function stake(uint256 amount, uint256 lockPeriod) external;
    function withdraw(uint256 amount) external;
    
    // Reputation Functions
    function addReputation(address agent, uint256 delta) external;
    function removeReputation(address agent, uint256 delta) external;
    function completeTask(address agent, uint256 reward) external;
    function failTask(address agent, uint256 penalty) external;
    
    // View Functions
    function getReputation(address agent) external view returns (ReputationInfo memory);
    function getScore(address agent) external view returns (uint256);
    function getStakedAmount(address agent) external view returns (uint256);
    function canWithdraw(address agent) external view returns (bool);
}
