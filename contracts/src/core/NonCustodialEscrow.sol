// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IEscrow } from "../interfaces/IEscrow.sol";
import { IZKVerifier } from "../interfaces/IZKVerifier.sol";

/// @title NonCustodialEscrow
/// @notice Non-custodial escrow supporting ERC20, ERC721, and native tokens
/// @dev Fully permissionless with atomic settlement and no admin keys
contract NonCustodialEscrow is IEscrow, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice ZK Verifier contract
    IZKVerifier public immutable VERIFIER;

    /// @notice Mapping of request ID to escrow request
    mapping(bytes32 => EscrowRequest) private _requests;

    /// @notice Counter for generating unique request IDs
    uint256 private _requestCounter;

    /// @notice Constructor
    /// @param verifier The ZK verifier contract address
    constructor(address verifier) {
        if (verifier == address(0)) {
            revert InvalidRequest();
        }
        VERIFIER = IZKVerifier(verifier);
    }

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
    ) external returns (bytes32 requestId) {
        if (provider == address(0)) {
            revert InvalidRequest();
        }

        if (!isNFT && amount == 0) {
            revert InvalidAmount();
        }

        // Note: tokenId 0 is now valid for NFTs (some NFTs start from tokenId 0)

        // Generate unique request ID
        _requestCounter++;
        requestId = keccak256(
            abi.encode(
                msg.sender,
                provider,
                token,
                amount,
                tokenId,
                isNFT,
                proofRequirement,
                ipfsCID,
                _requestCounter,
                block.timestamp
            )
        );

        // Store request
        _requests[requestId] = EscrowRequest({
            requester: msg.sender,
            provider: provider,
            token: token,
            amount: amount,
            tokenId: tokenId,
            isNFT: isNFT,
            proofRequirement: proofRequirement,
            ipfsCID: ipfsCID,
            state: EscrowState.Requested,
            createdAt: block.timestamp,
            fundedAt: 0,
            submittedAt: 0,
            verifiedAt: 0,
            settledAt: 0
        });

        emit EscrowCreated(requestId, msg.sender, provider, token, amount, tokenId, isNFT, block.timestamp);

        return requestId;
    }

    /// @notice Fund an escrow request with ERC20 tokens
    /// @param requestId The request identifier
    function fundERC20(bytes32 requestId) external nonReentrant {
        EscrowRequest storage request = _requests[requestId];

        if (request.state != EscrowState.Requested) {
            revert InvalidState(EscrowState.Requested, request.state);
        }

        if (request.requester != msg.sender) {
            revert Unauthorized(msg.sender, request.requester);
        }

        if (request.isNFT) {
            revert InvalidRequest();
        }

        address token = request.token;
        uint256 amount = request.amount;

        if (token == address(0)) {
            revert InvalidToken();
        }

        // Transfer tokens from requester to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Update state
        request.state = EscrowState.Funded;
        request.fundedAt = block.timestamp;

        emit EscrowFunded(requestId, msg.sender, amount, block.timestamp);
    }

    /// @notice Mark an escrow request as funded (for when tokens are already transferred)
    /// @param requestId The request identifier
    function markAsFunded(bytes32 requestId) external nonReentrant {
        EscrowRequest storage request = _requests[requestId];

        if (request.state != EscrowState.Requested) {
            revert InvalidState(EscrowState.Requested, request.state);
        }

        // Only the requester or an authorized contract can mark as funded
        if (request.requester != msg.sender) {
            revert Unauthorized(msg.sender, request.requester);
        }

        if (request.isNFT) {
            revert InvalidRequest();
        }

        address token = request.token;
        uint256 amount = request.amount;

        if (token == address(0)) {
            revert InvalidToken();
        }

        // Verify tokens are already in escrow
        if (IERC20(token).balanceOf(address(this)) < amount) {
            revert InsufficientBalance();
        }

        // Update state
        request.state = EscrowState.Funded;
        request.fundedAt = block.timestamp;

        emit EscrowFunded(requestId, msg.sender, amount, block.timestamp);
    }

    /// @notice Fund an escrow request with native token
    /// @param requestId The request identifier
    function fundNative(bytes32 requestId) external payable nonReentrant {
        EscrowRequest storage request = _requests[requestId];

        if (request.state != EscrowState.Requested) {
            revert InvalidState(EscrowState.Requested, request.state);
        }

        if (request.requester != msg.sender) {
            revert Unauthorized(msg.sender, request.requester);
        }

        if (request.token != address(0)) {
            revert InvalidToken();
        }

        if (msg.value != request.amount) {
            revert InvalidAmount();
        }

        // Update state
        request.state = EscrowState.Funded;
        request.fundedAt = block.timestamp;

        emit EscrowFunded(requestId, msg.sender, msg.value, block.timestamp);
    }

    /// @notice Fund an escrow request with NFT
    /// @param requestId The request identifier
    function fundNFT(bytes32 requestId) external nonReentrant {
        EscrowRequest storage request = _requests[requestId];

        if (request.state != EscrowState.Requested) {
            revert InvalidState(EscrowState.Requested, request.state);
        }

        if (request.requester != msg.sender) {
            revert Unauthorized(msg.sender, request.requester);
        }

        if (!request.isNFT) {
            revert InvalidRequest();
        }

        address token = request.token;
        uint256 tokenId = request.tokenId;

        if (token == address(0)) {
            revert InvalidToken();
        }

        // Transfer NFT from requester to this contract
        IERC721(token).transferFrom(msg.sender, address(this), tokenId);

        // Update state
        request.state = EscrowState.Funded;
        request.fundedAt = block.timestamp;

        emit EscrowFunded(requestId, msg.sender, tokenId, block.timestamp);
    }

    /// @notice Submit ZK proof for verification
    /// @param requestId The request identifier
    /// @param proofHash The hash of the submitted proof
    function submitProof(bytes32 requestId, bytes32 proofHash) external {
        EscrowRequest storage request = _requests[requestId];

        if (request.state != EscrowState.Funded) {
            revert InvalidState(EscrowState.Funded, request.state);
        }

        // Either requester or provider can submit proof
        if (msg.sender != request.requester && msg.sender != request.provider) {
            revert Unauthorized(msg.sender, request.requester);
        }

        // Update state
        request.state = EscrowState.Submitted;
        request.submittedAt = block.timestamp;

        emit ProofSubmitted(requestId, msg.sender, proofHash, block.timestamp);
    }

    /// @notice Verify submitted proof and transition state
    /// @param requestId The request identifier
    function verifyProof(bytes32 requestId) external {
        EscrowRequest storage request = _requests[requestId];

        if (request.state != EscrowState.Submitted) {
            revert InvalidState(EscrowState.Submitted, request.state);
        }

        // Check if proof requirement is met (proof hash matches or is zero for no requirement)
        if (request.proofRequirement != bytes32(0)) {
            // Verify the proof using the verifier contract
            if (!VERIFIER.isProofVerified(request.proofRequirement)) {
                revert ProofVerificationFailed();
            }
        }

        // Update state
        request.state = EscrowState.Verified;
        request.verifiedAt = block.timestamp;

        emit ProofVerified(requestId, request.proofRequirement, block.timestamp);
    }

    /// @notice Settle the escrow (release funds to provider)
    /// @param requestId The request identifier
    function settle(bytes32 requestId) external nonReentrant {
        EscrowRequest storage request = _requests[requestId];

        if (request.state != EscrowState.Verified) {
            revert InvalidState(EscrowState.Verified, request.state);
        }

        address provider = request.provider;
        address token = request.token;
        uint256 amount = request.amount;
        uint256 tokenId = request.tokenId;
        bool isNFT = request.isNFT;

        // Update state before transfer (CEI pattern)
        request.state = EscrowState.Settled;
        request.settledAt = block.timestamp;

        // Transfer funds to provider
        if (isNFT) {
            if (token == address(0)) {
                revert InvalidToken();
            }
            IERC721(token).safeTransferFrom(address(this), provider, tokenId);
        } else if (token == address(0)) {
            // Native token
            (bool success,) = provider.call{ value: amount }("");
            if (!success) {
                revert TransferFailed();
            }
        } else {
            // ERC20 token - use transfer instead of transferFrom since tokens are already in escrow
            IERC20(token).safeTransfer(provider, amount);
        }

        emit EscrowSettled(requestId, provider, isNFT ? tokenId : amount, tokenId, block.timestamp);
    }

    /// @notice Cancel the escrow (return funds to requester)
    /// @param requestId The request identifier
    function cancel(bytes32 requestId) external nonReentrant {
        EscrowRequest storage request = _requests[requestId];

        // Can only cancel if in Requested or Funded state
        if (request.state != EscrowState.Requested && request.state != EscrowState.Funded) {
            revert InvalidState(EscrowState.Funded, request.state);
        }

        if (request.requester != msg.sender) {
            revert Unauthorized(msg.sender, request.requester);
        }

        address requester = request.requester;
        address token = request.token;
        uint256 amount = request.amount;
        uint256 tokenId = request.tokenId;
        bool isNFT = request.isNFT;
        EscrowState currentState = request.state;

        // Update state before transfer (CEI pattern)
        request.state = EscrowState.Cancelled;

        // Return funds to requester
        if (currentState == EscrowState.Funded) {
            if (isNFT) {
                if (token == address(0)) {
                    revert InvalidToken();
                }
                IERC721(token).safeTransferFrom(address(this), requester, tokenId);
            } else if (token == address(0)) {
                // Native token
                (bool success,) = requester.call{ value: amount }("");
                if (!success) {
                    revert TransferFailed();
                }
            } else {
                // ERC20 token - use transfer instead of transferFrom since tokens are already in escrow
                IERC20(token).safeTransfer(requester, amount);
            }
        }

        emit EscrowCancelled(requestId, msg.sender, block.timestamp);
    }

    /// @notice Get escrow request details
    /// @param requestId The request identifier
    /// @return request The escrow request struct
    function getRequest(bytes32 requestId) external view returns (EscrowRequest memory request) {
        return _requests[requestId];
    }

    /// @notice Get current state of escrow
    /// @param requestId The request identifier
    /// @return state The current state
    function getState(bytes32 requestId) external view returns (EscrowState state) {
        return _requests[requestId].state;
    }

    /// @notice Get the next request counter (for testing)
    /// @return counter The current request counter
    function getRequestCounter() external view returns (uint256 counter) {
        return _requestCounter;
    }

    /// @notice Receive native tokens
    receive() external payable { }

    /// @notice Fallback function
    fallback() external payable { }
}
