// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IAgentRegistry } from "../interfaces/IAgentRegistry.sol";
import { IEscrow } from "../interfaces/IEscrow.sol";
import { IZKVerifier } from "../interfaces/IZKVerifier.sol";
import { IRequestContract } from "../interfaces/IRequestContract.sol";

/// @title RequestContract
/// @notice Agent-to-Agent (A2A) Request Primitive with state machine
/// @dev Integrates with Escrow + Verifier + AgentRegistry
contract RequestContract is IRequestContract, ReentrancyGuard {
    using SafeERC20 for IERC20;
    /// @notice Agent Registry contract
    IAgentRegistry public immutable AGENT_REGISTRY;

    /// @notice Escrow contract
    IEscrow public immutable ESCROW;

    /// @notice Mapping of request ID to A2A request
    mapping(bytes32 => A2ARequest) private _requests;

    /// @notice Mapping of request ID to escrow request ID
    mapping(bytes32 => bytes32) private _escrowRequestIds;

    /// @notice Mapping of request ID to submitted proof hash
    mapping(bytes32 => bytes32) private _submittedProofs;

    /// @notice Counter for generating unique request IDs
    uint256 private _requestCounter;

    /// @notice Constructor
    /// @param agentRegistry The agent registry contract address
    /// @param escrow The escrow contract address
    constructor(address agentRegistry, address escrow) {
        if (agentRegistry == address(0) || escrow == address(0)) {
            revert InvalidAgents();
        }
        AGENT_REGISTRY = IAgentRegistry(agentRegistry);
        ESCROW = IEscrow(escrow);
    }

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
    ) external returns (bytes32 requestId) {
        address requesterAgent = msg.sender;

        // Validate agents
        if (requesterAgent == address(0) || providerAgent == address(0)) {
            revert InvalidAgents();
        }

        // Verify both agents are registered
        if (!AGENT_REGISTRY.isRegistered(requesterAgent)) {
            revert OnlyRegisteredAgents();
        }
        if (!AGENT_REGISTRY.isRegistered(providerAgent)) {
            revert OnlyRegisteredAgents();
        }

        // Validate payment
        if (!isNFT && paymentAmount == 0) {
            revert InvalidPayment();
        }

        // Validate deadline
        if (deadline <= block.timestamp) {
            revert InvalidDeadline();
        }

        // Generate unique request ID
        _requestCounter++;
        requestId = keccak256(
            abi.encode(
                requesterAgent,
                providerAgent,
                escrowToken,
                paymentAmount,
                tokenId,
                isNFT,
                proofRequirement,
                deadline,
                _requestCounter,
                block.timestamp
            )
        );

        // Store request
        _requests[requestId] = A2ARequest({
            requestId: requestId,
            requesterAgent: requesterAgent,
            providerAgent: providerAgent,
            escrowToken: escrowToken,
            paymentAmount: paymentAmount,
            tokenId: tokenId,
            isNFT: isNFT,
            proofRequirement: proofRequirement,
            state: RequestState.Requested,
            createdAt: block.timestamp,
            deadline: deadline
        });

        // Create corresponding escrow request
        bytes32 escrowRequestId = ESCROW.createRequest(
            providerAgent,
            escrowToken,
            paymentAmount,
            tokenId,
            isNFT,
            proofRequirement,
            bytes32(0) // IPFS CID can be added via extension
        );
        _escrowRequestIds[requestId] = escrowRequestId;

        emit A2ARequestCreated(
            requestId, requesterAgent, providerAgent, escrowToken, paymentAmount, deadline, block.timestamp
        );

        return requestId;
    }

    /// @notice Fund the request via escrow
    /// @param requestId The request identifier
    function fundRequest(bytes32 requestId) external payable nonReentrant {
        A2ARequest storage request = _requests[requestId];

        if (request.state != RequestState.Requested) {
            revert StateTransitionNotAllowed(request.state, RequestState.Funded);
        }

        if (request.requesterAgent != msg.sender) {
            revert Unauthorized(msg.sender, request.requesterAgent);
        }

        if (block.timestamp > request.deadline) {
            revert RequestExpired();
        }

        bytes32 escrowRequestId = _escrowRequestIds[requestId];
        address agent = request.requesterAgent;

        // Fund the escrow - transfer tokens directly from agent to escrow
        if (request.isNFT) {
            IERC721(request.escrowToken).safeTransferFrom(agent, address(ESCROW), request.tokenId);
            ESCROW.fundNFT(escrowRequestId);
        } else if (request.escrowToken == address(0)) {
            ESCROW.fundNative{ value: msg.value }(escrowRequestId);
        } else {
            // Transfer ERC20 from agent to escrow, then mark as funded
            IERC20(request.escrowToken).safeTransferFrom(agent, address(ESCROW), request.paymentAmount);
            ESCROW.markAsFunded(escrowRequestId);
        }

        // Update state
        RequestState oldState = request.state;
        request.state = RequestState.Funded;

        emit RequestStateChanged(requestId, oldState, RequestState.Funded, block.timestamp);
    }

    /// @notice Submit proof for the request
    /// @param requestId The request identifier
    /// @param proofHash The hash of the submitted proof
    function submitProof(bytes32 requestId, bytes32 proofHash) external {
        A2ARequest storage request = _requests[requestId];

        if (request.state != RequestState.Funded) {
            revert StateTransitionNotAllowed(request.state, RequestState.Submitted);
        }

        // Either agent can submit proof
        if (msg.sender != request.requesterAgent && msg.sender != request.providerAgent) {
            revert Unauthorized(msg.sender, request.requesterAgent);
        }

        if (block.timestamp > request.deadline) {
            revert RequestExpired();
        }

        // Store submitted proof
        _submittedProofs[requestId] = proofHash;

        // Submit proof to escrow
        bytes32 escrowRequestId = _escrowRequestIds[requestId];
        ESCROW.submitProof(escrowRequestId, proofHash);

        // Update state
        RequestState oldState = request.state;
        request.state = RequestState.Submitted;

        emit RequestStateChanged(requestId, oldState, RequestState.Submitted, block.timestamp);
    }

    /// @notice Verify the submitted proof
    /// @param requestId The request identifier
    function verifyProof(bytes32 requestId) external nonReentrant {
        A2ARequest storage request = _requests[requestId];

        if (request.state != RequestState.Submitted) {
            revert StateTransitionNotAllowed(request.state, RequestState.Verified);
        }

        bytes32 escrowRequestId = _escrowRequestIds[requestId];

        // Verify proof via escrow
        ESCROW.verifyProof(escrowRequestId);

        // Update state
        RequestState oldState = request.state;
        request.state = RequestState.Verified;

        emit RequestStateChanged(requestId, oldState, RequestState.Verified, block.timestamp);
    }

    /// @notice Settle the request
    /// @param requestId The request identifier
    function settleRequest(bytes32 requestId) external nonReentrant {
        A2ARequest storage request = _requests[requestId];

        if (request.state != RequestState.Verified) {
            revert StateTransitionNotAllowed(request.state, RequestState.Settled);
        }

        bytes32 escrowRequestId = _escrowRequestIds[requestId];

        // Settle via escrow
        ESCROW.settle(escrowRequestId);

        // Update state
        RequestState oldState = request.state;
        request.state = RequestState.Settled;

        emit RequestStateChanged(requestId, oldState, RequestState.Settled, block.timestamp);
    }

    /// @notice Get A2A request details
    /// @param requestId The request identifier
    /// @return request The A2A request struct
    function getRequest(bytes32 requestId) external view returns (A2ARequest memory request) {
        return _requests[requestId];
    }

    /// @notice Get request state
    /// @param requestId The request identifier
    /// @return state The current state
    function getRequestState(bytes32 requestId) external view returns (RequestState state) {
        return _requests[requestId].state;
    }

    /// @notice Get the escrow request ID for an A2A request
    /// @param requestId The A2A request identifier
    /// @return escrowRequestId The escrow request identifier
    function getEscrowRequestId(bytes32 requestId) external view returns (bytes32 escrowRequestId) {
        return _escrowRequestIds[requestId];
    }

    /// @notice Get the submitted proof hash for a request
    /// @param requestId The request identifier
    /// @return proofHash The submitted proof hash
    function getSubmittedProof(bytes32 requestId) external view returns (bytes32 proofHash) {
        return _submittedProofs[requestId];
    }

    /// @notice Get the next request counter (for testing)
    /// @return counter The current request counter
    function getRequestCounter() external view returns (uint256 counter) {
        return _requestCounter;
    }
}
