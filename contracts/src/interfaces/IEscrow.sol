// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IEscrow
/// @notice Interface for Non-Custodial Escrow contract
interface IEscrow {
    /// @notice Escrow state machine
    enum EscrowState {
        None,
        Requested,
        Funded,
        Submitted,
        Verified,
        Settled,
        Cancelled
    }

    /// @notice Escrow request structure
    struct EscrowRequest {
        address requester; // Agent requesting the service
        address provider; // Agent providing the service
        address token; // Token address (0x0 for ETH/AVAX)
        uint256 amount; // Payment amount
        uint256 tokenId; // NFT token ID (0 for ERC20)
        bool isNFT; // Whether this is an NFT escrow
        bytes32 proofRequirement; // Required proof hash
        bytes32 ipfsCID; // IPFS CID for request details
        EscrowState state; // Current state
        uint256 createdAt; // Creation timestamp
        uint256 fundedAt; // Funding timestamp
        uint256 submittedAt; // Proof submission timestamp
        uint256 verifiedAt; // Verification timestamp
        uint256 settledAt; // Settlement timestamp
    }

    /// @notice Emitted when escrow is created
    event EscrowCreated(
        bytes32 indexed requestId,
        address indexed requester,
        address indexed provider,
        address token,
        uint256 amount,
        uint256 tokenId,
        bool isNFT,
        uint256 timestamp
    );

    /// @notice Emitted when escrow is funded
    event EscrowFunded(bytes32 indexed requestId, address indexed funder, uint256 amount, uint256 timestamp);

    /// @notice Emitted when proof is submitted
    event ProofSubmitted(bytes32 indexed requestId, address indexed submitter, bytes32 proofHash, uint256 timestamp);

    /// @notice Emitted when proof is verified
    event ProofVerified(bytes32 indexed requestId, bytes32 proofHash, uint256 timestamp);

    /// @notice Emitted when escrow is settled
    event EscrowSettled(
        bytes32 indexed requestId, address indexed recipient, uint256 amount, uint256 tokenId, uint256 timestamp
    );

    /// @notice Emitted when escrow is cancelled
    event EscrowCancelled(bytes32 indexed requestId, address indexed canceller, uint256 timestamp);

    /// @notice Custom errors
    error InvalidRequest();
    error RequestNotFound(bytes32 requestId);
    error InvalidState(EscrowState expected, EscrowState actual);
    error InvalidAmount();
    error InvalidToken();
    error Unauthorized(address caller, address expected);
    error InsufficientBalance();
    error InsufficientAllowance();
    error TransferFailed();
    error AlreadySettled();
    error AlreadyCancelled();
    error ProofVerificationFailed();

    /// @notice Create a new escrow request
    /// @param provider The provider agent address
    /// @param token The token address (0x0 for native)
    /// @param amount The payment amount
    /// @param tokenId The NFT token ID (0 for ERC20)
    /// @param isNFT Whether this is an NFT escrow
    /// @param proofRequirement The required proof hash
    /// @param ipfsCID The IPFS CID for request details
    /// @return requestId The unique request identifier
    function createRequest(
        address provider,
        address token,
        uint256 amount,
        uint256 tokenId,
        bool isNFT,
        bytes32 proofRequirement,
        bytes32 ipfsCID
    ) external returns (bytes32 requestId);

    /// @notice Fund an escrow request with ERC20 tokens
    /// @param requestId The request identifier
    function fundERC20(bytes32 requestId) external;

    /// @notice Mark an escrow request as funded (for when tokens are already transferred)
    /// @param requestId The request identifier
    function markAsFunded(bytes32 requestId) external;

    /// @notice Fund an escrow request with native token
    /// @param requestId The request identifier
    function fundNative(bytes32 requestId) external payable;

    /// @notice Fund an escrow request with NFT
    /// @param requestId The request identifier
    function fundNFT(bytes32 requestId) external;

    /// @notice Submit ZK proof for verification
    /// @param requestId The request identifier
    /// @param proofHash The hash of the submitted proof
    function submitProof(bytes32 requestId, bytes32 proofHash) external;

    /// @notice Verify submitted proof and transition state
    /// @param requestId The request identifier
    function verifyProof(bytes32 requestId) external;

    /// @notice Settle the escrow (release funds to provider)
    /// @param requestId The request identifier
    function settle(bytes32 requestId) external;

    /// @notice Cancel the escrow (return funds to requester)
    /// @param requestId The request identifier
    function cancel(bytes32 requestId) external;

    /// @notice Get escrow request details
    /// @param requestId The request identifier
    /// @return request The escrow request struct
    function getRequest(bytes32 requestId) external view returns (EscrowRequest memory request);

    /// @notice Get current state of escrow
    /// @param requestId The request identifier
    /// @return state The current state
    function getState(bytes32 requestId) external view returns (EscrowState state);
}
