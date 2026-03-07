// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IRequestContract
/// @notice Interface for Agent-to-Agent Request Contract
interface IRequestContract {
    /// @notice Request state machine
    enum RequestState {
        Requested,
        Funded,
        Submitted,
        Verified,
        Settled
    }

    /// @notice A2A Request structure
    struct A2ARequest {
        bytes32 requestId;
        address requesterAgent; // Token-bound account of requester
        address providerAgent; // Token-bound account of provider
        address escrowToken; // Token address for payment
        uint256 paymentAmount; // Payment amount
        uint256 tokenId; // NFT token ID if applicable
        bool isNFT; // Whether payment is NFT
        bytes32 proofRequirement; // Required proof hash
        RequestState state; // Current state
        uint256 createdAt; // Creation timestamp
        uint256 deadline; // Request deadline
    }

    /// @notice Emitted when A2A request is created
    event A2ARequestCreated(
        bytes32 indexed requestId,
        address indexed requesterAgent,
        address indexed providerAgent,
        address escrowToken,
        uint256 paymentAmount,
        uint256 deadline,
        uint256 timestamp
    );

    /// @notice Emitted when request state changes
    event RequestStateChanged(
        bytes32 indexed requestId, RequestState oldState, RequestState newState, uint256 timestamp
    );

    /// @notice Custom errors
    error InvalidAgents();
    error InvalidPayment();
    error InvalidDeadline();
    error RequestExpired();
    error StateTransitionNotAllowed(RequestState from, RequestState to);
    error OnlyRegisteredAgents();
    error Unauthorized(address caller, address expected);

    /// @notice Create a new A2A request
    /// @param providerAgent The provider agent address
    /// @param escrowToken The token address for payment
    /// @param paymentAmount The payment amount
    /// @param tokenId The NFT token ID (0 for ERC20)
    /// @param isNFT Whether payment is NFT
    /// @param proofRequirement The required proof hash
    /// @param deadline The request deadline
    /// @return requestId The unique request identifier
    function createRequest(
        address providerAgent,
        address escrowToken,
        uint256 paymentAmount,
        uint256 tokenId,
        bool isNFT,
        bytes32 proofRequirement,
        uint256 deadline
    ) external returns (bytes32 requestId);

    /// @notice Fund the request via escrow
    /// @param requestId The request identifier
    function fundRequest(bytes32 requestId) external payable;

    /// @notice Submit proof for the request
    /// @param requestId The request identifier
    /// @param proofHash The hash of the submitted proof
    function submitProof(bytes32 requestId, bytes32 proofHash) external;

    /// @notice Verify the submitted proof
    /// @param requestId The request identifier
    function verifyProof(bytes32 requestId) external;

    /// @notice Settle the request
    /// @param requestId The request identifier
    function settleRequest(bytes32 requestId) external;

    /// @notice Get A2A request details
    /// @param requestId The request identifier
    /// @return request The A2A request struct
    function getRequest(bytes32 requestId) external view returns (A2ARequest memory request);

    /// @notice Get request state
    /// @param requestId The request identifier
    /// @return state The current state
    function getRequestState(bytes32 requestId) external view returns (RequestState state);
}
