// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IZKVerifier } from "./IZKVerifier.sol";

/// @title IGAT
/// @notice Interface for Genuine Agent Test contract
interface IGAT {
    /// @notice GAT test result structure
    struct GATResult {
        bool passed;
        bytes32 proofHash;
        uint256 timestamp;
        bytes32 capabilityTested;
    }

    /// @notice Emitted when GAT test is performed
    event GATTestPerformed(
        address indexed agent, bytes32 indexed capabilityTested, bytes32 proofHash, bool passed, uint256 timestamp
    );

    /// @notice Custom errors
    error AgentNotRegistered(address agent);
    error InvalidProof();
    error TestAlreadyPassed(address agent, bytes32 capability);
    error CapabilityNotSupported(bytes32 capability);

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
    ) external returns (bool passed);

    /// @notice Get GAT result for an agent and capability
    /// @param agent The agent address
    /// @param capability The capability tested
    /// @return result The GAT result
    function getGATResult(address agent, bytes32 capability) external view returns (GATResult memory result);

    /// @notice Check if agent has passed GAT for a capability
    /// @param agent The agent address
    /// @param capability The capability tested
    /// @return passed Whether the test was passed
    function hasPassedGAT(address agent, bytes32 capability) external view returns (bool passed);

    /// @notice Get all capabilities an agent has passed GAT for
    /// @param agent The agent address
    /// @return capabilities Array of capability hashes
    function getPassedCapabilities(address agent) external view returns (bytes32[] memory capabilities);
}
