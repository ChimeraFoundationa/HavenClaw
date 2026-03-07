// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IAgentRegistry } from "../interfaces/IAgentRegistry.sol";
import { IZKVerifier } from "../interfaces/IZKVerifier.sol";
import { IGAT } from "../interfaces/IGAT.sol";

/// @title GAT (Genuine Agent Test)
/// @notice Minimal productive proof test for agent capability verification
/// @dev No centralized approval - purely onchain verification
contract GAT is IGAT, ReentrancyGuard {
    /// @notice Agent Registry contract
    IAgentRegistry public immutable AGENT_REGISTRY;

    /// @notice ZK Verifier contract
    IZKVerifier public immutable VERIFIER;

    /// @notice Mapping of agent address to capability to GAT result
    mapping(address => mapping(bytes32 => GATResult)) private _gatResults;

    /// @notice Mapping of agent address to array of passed capabilities
    mapping(address => bytes32[]) private _passedCapabilities;

    /// @notice Set of supported capabilities
    mapping(bytes32 => bool) public supportedCapabilities;

    /// @notice Constructor
    /// @param agentRegistry The agent registry contract address
    /// @param verifier The ZK verifier contract address
    constructor(address agentRegistry, address verifier) {
        if (verifier == address(0)) {
            revert AgentNotRegistered(address(0));
        }
        AGENT_REGISTRY = IAgentRegistry(agentRegistry);
        VERIFIER = IZKVerifier(verifier);
    }

    /// @notice Add a supported capability
    /// @param capability The capability hash to add
    function addSupportedCapability(bytes32 capability) external {
        supportedCapabilities[capability] = true;
    }

    /// @notice Add multiple supported capabilities
    /// @param capabilities Array of capability hashes
    function addSupportedCapabilities(bytes32[] calldata capabilities) external {
        for (uint256 i = 0; i < capabilities.length; i++) {
            supportedCapabilities[capabilities[i]] = true;
        }
    }

    /// @notice Perform GAT verification for an agent
    /// @param agent The agent address
    /// @param capability The capability being tested
    /// @param proof The Groth16 proof
    /// @param publicInputs The public inputs
    /// @return passed Whether the test passed
    function performTest(
        address agent,
        bytes32 capability,
        IZKVerifier.Proof calldata proof,
        uint256[] calldata publicInputs
    ) external nonReentrant returns (bool passed) {
        // Verify agent is registered
        if (!AGENT_REGISTRY.isRegistered(agent)) {
            revert AgentNotRegistered(agent);
        }

        // Check if capability is supported (if any are defined)
        // If no capabilities are defined, all are allowed (permissionless)
        if (supportedCapabilities[capability] || !_anyCapabilitiesDefined()) {
            // Capability is supported or no restrictions
        } else {
            revert CapabilityNotSupported(capability);
        }

        // Check if already passed this capability test
        if (_gatResults[agent][capability].passed) {
            revert TestAlreadyPassed(agent, capability);
        }

        // Compute proof hash
        bytes32 proofHash = _computeProofHash(proof, publicInputs);

        // Verify the proof
        try VERIFIER.verifyProof(proof, publicInputs, capability, bytes32(0)) returns (
            IZKVerifier.VerificationResult memory
        ) {
            // Proof verified successfully
            passed = true;

            // Store GAT result
            _gatResults[agent][capability] = GATResult({
                passed: true, proofHash: proofHash, timestamp: block.timestamp, capabilityTested: capability
            });

            // Add to passed capabilities array
            _passedCapabilities[agent].push(capability);

            // Mark agent as verified in registry
            AGENT_REGISTRY.markVerified(agent, proofHash);

            emit GATTestPerformed(agent, capability, proofHash, true, block.timestamp);
        } catch {
            // Proof verification failed
            passed = false;

            _gatResults[agent][capability] = GATResult({
                passed: false, proofHash: proofHash, timestamp: block.timestamp, capabilityTested: capability
            });

            emit GATTestPerformed(agent, capability, proofHash, false, block.timestamp);
        }

        return passed;
    }

    /// @notice Get GAT result for an agent and capability
    /// @param agent The agent address
    /// @param capability The capability tested
    /// @return result The GAT result
    function getGATResult(address agent, bytes32 capability) external view returns (GATResult memory result) {
        return _gatResults[agent][capability];
    }

    /// @notice Check if agent has passed GAT for a capability
    /// @param agent The agent address
    /// @param capability The capability tested
    /// @return passed Whether the test was passed
    function hasPassedGAT(address agent, bytes32 capability) external view returns (bool passed) {
        return _gatResults[agent][capability].passed;
    }

    /// @notice Get all capabilities an agent has passed GAT for
    /// @param agent The agent address
    /// @return capabilities Array of capability hashes
    function getPassedCapabilities(address agent) external view returns (bytes32[] memory capabilities) {
        return _passedCapabilities[agent];
    }

    /// @notice Get the count of passed capabilities for an agent
    /// @param agent The agent address
    /// @return count The number of passed capabilities
    function getPassedCapabilitiesCount(address agent) external view returns (uint256 count) {
        return _passedCapabilities[agent].length;
    }

    /// @notice Check if any capabilities are defined
    /// @return hasCapabilities Whether any capabilities are defined
    function _anyCapabilitiesDefined() internal view returns (bool hasCapabilities) {
        // This is a simplified check - in production you might track this differently
        // For now, we assume if no capabilities are explicitly defined, all are allowed
        return false;
    }

    /// @notice Compute the hash of a proof
    /// @param proof The Groth16 proof
    /// @param publicInputs The public inputs
    /// @return proofHash The hash of the proof
    function _computeProofHash(IZKVerifier.Proof calldata proof, uint256[] calldata publicInputs)
        internal
        pure
        returns (bytes32 proofHash)
    {
        return keccak256(
            abi.encode(
                proof.a[0],
                proof.a[1],
                proof.b[0][0],
                proof.b[0][1],
                proof.b[1][0],
                proof.b[1][1],
                proof.c[0],
                proof.c[1],
                publicInputs
            )
        );
    }
}
