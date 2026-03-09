// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOpenClawTaskMarketplace
 * @dev Interface for OpenClaw Task Marketplace
 */
interface IOpenClawTaskMarketplace {
    enum TaskStatus {
        Open,
        Accepted,
        InProgress,
        Completed,
        Disputed,
        Cancelled
    }

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
        uint256 completedAt;
    }

    struct TaskBid {
        uint256 taskId;
        address bidder;
        uint256 proposedReward;
        uint256 estimatedCompletionTime;
        bytes32[] capabilities;
        uint256 bidAt;
    }

    event TaskCreated(
        uint256 indexed taskId,
        address indexed creator,
        string description,
        uint256 reward
    );

    event TaskAccepted(
        uint256 indexed taskId,
        address indexed solver,
        uint256 acceptedAt
    );

    event TaskCompleted(
        uint256 indexed taskId,
        address indexed solver,
        string resultURI,
        uint256 completedAt
    );

    event TaskDisputed(
        uint256 indexed taskId,
        address indexed creator,
        string reason
    );

    event TaskCancelled(uint256 indexed taskId, address indexed creator);

    event TaskBidSubmitted(
        uint256 indexed taskId,
        address indexed bidder,
        uint256 proposedReward
    );

    function createTask(
        string calldata description,
        bytes32 requiredCapability,
        uint256 reward,
        address rewardToken,
        uint256 deadline
    ) external payable returns (uint256);

    function acceptTask(uint256 taskId) external;

    function completeTask(uint256 taskId, string calldata resultURI, bytes calldata proof) external;

    function disputeTask(uint256 taskId, string calldata reason) external;

    function cancelTask(uint256 taskId) external;

    function submitBid(
        uint256 taskId,
        uint256 proposedReward,
        uint256 estimatedCompletionTime,
        bytes32[] calldata capabilities
    ) external;

    function getTask(uint256 taskId) external view returns (Task memory);

    function getTaskStatus(uint256 taskId) external view returns (TaskStatus);

    function getOpenTasks() external view returns (uint256[] memory);

    function getTaskBids(uint256 taskId) external view returns (TaskBid[] memory);
}
