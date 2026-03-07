// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title ITaskMarketplace - Task Marketplace Interface
/// @notice Interface for task creation and completion
interface ITaskMarketplace {
    // Enums
    enum TaskStatus { Open, InProgress, Completed, Cancelled }
    
    // Structs
    struct Task {
        uint256 taskId;
        address creator;
        address solver;
        string description;
        bytes32 requiredCapability;
        uint256 reward;
        address rewardToken;
        TaskStatus status;
        uint256 createdAt;
        uint256 deadline;
        string resultURI;
    }
    
    // Events
    event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 reward);
    event TaskAccepted(uint256 indexed taskId, address indexed solver);
    event TaskCompleted(uint256 indexed taskId, string resultURI);
    event TaskCancelled(uint256 indexed taskId);
    event TaskRewardClaimed(uint256 indexed taskId, address indexed solver);
    
    // Task Management
    function createTask(
        string calldata description,
        bytes32 requiredCapability,
        uint256 reward,
        address rewardToken,
        uint256 deadline
    ) external payable returns (uint256);
    
    function acceptTask(uint256 taskId) external;
    function completeTask(uint256 taskId, string calldata resultURI) external;
    function cancelTask(uint256 taskId) external;
    function claimReward(uint256 taskId) external;
    
    // View Functions
    function getTask(uint256 taskId) external view returns (Task memory);
    function getTaskCount() external view returns (uint256);
}
