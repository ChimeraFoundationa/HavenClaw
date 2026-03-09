// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IHavenClawPaymentProtocol
 * @dev Interface for HavenClaw Payment Protocol
 */
interface IHavenClawPaymentProtocol {
    struct Payment {
        uint256 id;
        address payer;
        address payable agent;
        uint256 amount;
        address token;
        bytes32 conditionHash;
        uint256 deadline;
        bool released;
        bool disputed;
        uint256 createdAt;
    }

    struct Agent {
        address wallet;
        bool registered;
        uint256 totalEarned;
        uint256 completedTasks;
        string metadataURI;
    }

    event AgentRegistered(address indexed agent, address indexed wallet, string metadataURI);
    event PaymentCreated(uint256 indexed paymentId, address indexed payer, address indexed agent, uint256 amount);
    event PaymentReleased(uint256 indexed paymentId, address indexed agent, uint256 amount);
    event PaymentDisputed(uint256 indexed paymentId, address indexed disputer, string reason);
    event PaymentRefunded(uint256 indexed paymentId, address indexed payer, uint256 amount);
    event ConditionMet(uint256 indexed paymentId, bytes proof);

    function registerAgent(string calldata metadataURI) external;
    function createPayment(address agent, bytes32 conditionHash, uint256 deadline, string calldata metadataURI) external payable returns (uint256);
    function createPaymentERC20(address agent, address token, uint256 amount, bytes32 conditionHash, uint256 deadline) external returns (uint256);
    function releasePayment(uint256 paymentId, bytes calldata proof) external;
    function refundPayment(uint256 paymentId) external;
    function disputePayment(uint256 paymentId, string calldata reason) external;
    function getAgentPayments(address agent) external view returns (uint256[] memory);
    function getPayment(uint256 paymentId) external view returns (Payment memory);
    function getAgent(address agent) external view returns (Agent memory);
}
