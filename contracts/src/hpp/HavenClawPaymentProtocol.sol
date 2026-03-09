// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title HavenClawPaymentProtocol (HPP) - Phase 1: PaymentRouter
 * @dev Standard payment protocol for AI agent interactions
 * 
 * Features:
 * - Direct agent payments
 * - Conditional payments (on completion proof)
 * - Multi-token support (ETH + ERC20)
 * - Payment disputes
 * - Gasless meta-transactions (future)
 * 
 * Use Cases:
 * - Task marketplace payments
 * - Governance rewards
 * - Agent-to-agent payments
 * - Subscription payments
 */
contract HavenClawPaymentProtocol is ReentrancyGuard, Context {
    using SafeERC20 for IERC20;

    // ==================== STRUCTS ====================

    struct Payment {
        uint256 id;
        address payer;
        address payable agent;
        uint256 amount;
        address token; // address(0) for native token
        bytes32 conditionHash; // Hash of completion conditions
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

    // ==================== EVENTS ====================

    event AgentRegistered(address indexed agent, address indexed wallet, string metadataURI);
    event PaymentCreated(uint256 indexed paymentId, address indexed payer, address indexed agent, uint256 amount);
    event PaymentReleased(uint256 indexed paymentId, address indexed agent, uint256 amount);
    event PaymentDisputed(uint256 indexed paymentId, address indexed disputer, string reason);
    event PaymentRefunded(uint256 indexed paymentId, address indexed payer, uint256 amount);
    event ConditionMet(uint256 indexed paymentId, bytes proof);

    // ==================== ERRORS ====================

    error HPP_InvalidAgent();
    error HPP_InvalidPayment();
    error HPP_PaymentExpired();
    error HPP_PaymentAlreadyReleased();
    error HPP_PaymentDisputed();
    error HPP_InvalidCondition();
    error HPP_OnlyAgent();
    error HPP_OnlyPayer();

    // ==================== STATE ====================

    mapping(uint256 => Payment) public payments;
    mapping(address => Agent) public agents;
    mapping(address => uint256[]) public agentPayments;
    mapping(uint256 => bytes) public conditionProofs;

    uint256 public paymentCounter;
    uint256 public platformFeeBps = 100; // 1% platform fee
    address public platformWallet;

    // ==================== MODIFIERS ====================

    modifier onlyRegisteredAgent(address agent) {
        if (!agents[agent].registered) revert HPP_InvalidAgent();
        _;
    }

    modifier validPayment(uint256 paymentId) {
        if (payments[paymentId].id == 0) revert HPP_InvalidPayment();
        _;
    }

    // ==================== CONSTRUCTOR ====================

    constructor(address _platformWallet) {
        platformWallet = _platformWallet;
    }

    // ==================== AGENT REGISTRATION ====================

    /**
     * @dev Register an agent for payments
     * @param metadataURI Agent metadata (IPFS/Arweave)
     */
    function registerAgent(string calldata metadataURI) external {
        Agent storage agent = agents[msg.sender];
        agent.wallet = msg.sender;
        agent.registered = true;
        agent.metadataURI = metadataURI;
        
        emit AgentRegistered(msg.sender, msg.sender, metadataURI);
    }

    /**
     * @dev Update agent metadata
     */
    function updateAgentMetadata(string calldata metadataURI) external {
        if (!agents[msg.sender].registered) revert HPP_InvalidAgent();
        agents[msg.sender].metadataURI = metadataURI;
    }

    // ==================== PAYMENT CREATION ====================

    /**
     * @dev Create a conditional payment for an agent
     * @param agent Agent address (must be registered)
     * @param conditionHash Hash of completion conditions
     * @param deadline Payment deadline (timestamp)
     */
    function createPayment(
        address agent,
        bytes32 conditionHash,
        uint256 deadline,
        string calldata /* metadataURI */
    ) external payable onlyRegisteredAgent(agent) returns (uint256) {
        if (msg.value == 0) revert HPP_InvalidPayment();
        if (deadline < block.timestamp) revert HPP_PaymentExpired();

        paymentCounter++;
        
        payments[paymentCounter] = Payment({
            id: paymentCounter,
            payer: msg.sender,
            agent: payable(agent),
            amount: msg.value,
            token: address(0), // Native token
            conditionHash: conditionHash,
            deadline: deadline,
            released: false,
            disputed: false,
            createdAt: block.timestamp
        });

        agentPayments[agent].push(paymentCounter);

        emit PaymentCreated(paymentCounter, msg.sender, agent, msg.value);
        return paymentCounter;
    }

    /**
     * @dev Create payment with ERC20 token
     * @param agent Agent address
     * @param token ERC20 token address
     * @param amount Payment amount
     * @param conditionHash Hash of completion conditions
     * @param deadline Payment deadline
     */
    function createPaymentERC20(
        address agent,
        address token,
        uint256 amount,
        bytes32 conditionHash,
        uint256 deadline
    ) external onlyRegisteredAgent(agent) returns (uint256) {
        if (amount == 0) revert HPP_InvalidPayment();
        if (deadline < block.timestamp) revert HPP_PaymentExpired();

        // Transfer tokens from payer to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        paymentCounter++;
        
        payments[paymentCounter] = Payment({
            id: paymentCounter,
            payer: msg.sender,
            agent: payable(agent),
            amount: amount,
            token: token,
            conditionHash: conditionHash,
            deadline: deadline,
            released: false,
            disputed: false,
            createdAt: block.timestamp
        });

        agentPayments[agent].push(paymentCounter);

        emit PaymentCreated(paymentCounter, msg.sender, agent, amount);
        return paymentCounter;
    }

    // ==================== PAYMENT RELEASE ====================

    /**
     * @dev Release payment to agent upon condition completion
     * @param paymentId Payment ID
     * @param proof Completion proof (bytes)
     */
    function releasePayment(
        uint256 paymentId,
        bytes calldata proof
    ) external nonReentrant validPayment(paymentId) {
        Payment storage payment = payments[paymentId];
        
        if (payment.released) revert HPP_PaymentAlreadyReleased();
        if (payment.disputed) revert HPP_PaymentDisputed();
        if (block.timestamp > payment.deadline) revert HPP_PaymentExpired();
        
        // Verify condition (simple hash match for now)
        if (keccak256(proof) != payment.conditionHash) {
            // Allow agent to claim after deadline even without proof
            if (msg.sender != payment.agent || block.timestamp <= payment.deadline) {
                revert HPP_InvalidCondition();
            }
        }

        payment.released = true;
        conditionProofs[paymentId] = proof;

        // Calculate fees
        uint256 platformFee = (payment.amount * platformFeeBps) / 10000;
        uint256 agentAmount = payment.amount - platformFee;

        // Update agent stats
        agents[payment.agent].totalEarned += agentAmount;
        agents[payment.agent].completedTasks++;

        // Transfer funds
        if (payment.token == address(0)) {
            // Native token
            (bool success,) = payment.agent.call{value: agentAmount}("");
            require(success, "Transfer failed");
            
            if (platformFee > 0) {
                (bool feeSuccess,) = payable(platformWallet).call{value: platformFee}("");
                require(feeSuccess, "Fee transfer failed");
            }
        } else {
            // ERC20 token
            IERC20(payment.token).safeTransfer(payment.agent, agentAmount);
            if (platformFee > 0) {
                IERC20(payment.token).safeTransfer(platformWallet, platformFee);
            }
        }

        emit ConditionMet(paymentId, proof);
        emit PaymentReleased(paymentId, payment.agent, agentAmount);
    }

    // ==================== PAYMENT REFUND ====================

    /**
     * @dev Refund payment to payer if deadline passed
     * @param paymentId Payment ID
     */
    function refundPayment(uint256 paymentId) external nonReentrant validPayment(paymentId) {
        Payment storage payment = payments[paymentId];
        
        if (payment.released) revert HPP_PaymentAlreadyReleased();
        if (block.timestamp <= payment.deadline) revert HPP_PaymentExpired();
        if (msg.sender != payment.payer) revert HPP_OnlyPayer();

        payment.released = true;

        // Refund full amount
        if (payment.token == address(0)) {
            (bool success,) = payment.payer.call{value: payment.amount}("");
            require(success, "Refund failed");
        } else {
            IERC20(payment.token).safeTransfer(payment.payer, payment.amount);
        }

        emit PaymentRefunded(paymentId, payment.payer, payment.amount);
    }

    // ==================== DISPUTE RESOLUTION ====================

    /**
     * @dev Dispute a payment (by payer or agent)
     * @param paymentId Payment ID
     * @param reason Dispute reason
     */
    function disputePayment(uint256 paymentId, string calldata reason) external validPayment(paymentId) {
        Payment storage payment = payments[paymentId];
        
        if (payment.released) revert HPP_PaymentAlreadyReleased();
        if (msg.sender != payment.payer && msg.sender != payment.agent) {
            revert HPP_InvalidPayment();
        }

        payment.disputed = true;
        emit PaymentDisputed(paymentId, msg.sender, reason);
        
        // In production: trigger governance vote or arbiter resolution
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @dev Get all payments for an agent
     */
    function getAgentPayments(address agent) external view returns (uint256[] memory) {
        return agentPayments[agent];
    }

    /**
     * @dev Get payment details
     */
    function getPayment(uint256 paymentId) external view returns (Payment memory) {
        return payments[paymentId];
    }

    /**
     * @dev Get agent details
     */
    function getAgent(address agent) external view returns (Agent memory) {
        return agents[agent];
    }

    /**
     * @dev Check if payment condition is met
     */
    function isConditionMet(uint256 paymentId) external view returns (bool) {
        return conditionProofs[paymentId].length > 0;
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @dev Update platform fee (basis points)
     */
    function setPlatformFee(uint256 newFeeBps) external {
        require(msg.sender == platformWallet, "Only platform");
        require(newFeeBps <= 500, "Max 5%"); // Max 5% fee
        platformFeeBps = newFeeBps;
    }

    /**
     * @dev Update platform wallet
     */
    function setPlatformWallet(address newWallet) external {
        require(msg.sender == platformWallet, "Only platform");
        platformWallet = newWallet;
    }

    // ==================== EMERGENCY FUNCTIONS ====================

    /**
     * @dev Emergency withdraw stuck tokens
     */
    function emergencyWithdraw(address token, uint256 amount) external {
        require(msg.sender == platformWallet, "Only platform");
        
        if (token == address(0)) {
            (bool success,) = platformWallet.call{value: amount}("");
            require(success, "Withdraw failed");
        } else {
            IERC20(token).safeTransfer(platformWallet, amount);
        }
    }

    // ==================== RECEIVE/ FALLBACK ====================

    receive() external payable {}
    fallback() external payable {}
}
