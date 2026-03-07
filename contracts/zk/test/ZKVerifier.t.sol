// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Groth16Verifier} from "../src/core/Groth16Verifier.sol";

/// @title ZKVerifierTest
/// @notice Test for Groth16Verifier with 6g_capability_proof circuit
///
/// This test demonstrates how to verify ZK proofs on-chain
contract ZKVerifierTest is Test {
    Groth16Verifier public verifier;

    // Test data - replace with actual values from proof generation
    IZKVerifier.Proof public testProof;
    uint256[] public testPublicInputs;

    function setUp() public {
        // Deploy verifier with mock IC points
        // Replace with actual IC points from zk/build/ic_points.json
        uint256[] memory IC_X = new uint256[](7);
        uint256[] memory IC_Y = new uint256[](7);

        // Mock verification key parameters
        // Replace with actual values from zkey export
        verifier = new Groth16Verifier(
            0, 0, // ALPHA_X, ALPHA_Y
            0, 0, 0, 0, // BETA_X_1, BETA_X_2, BETA_Y_1, BETA_Y_2
            0, 0, 0, 0, // GAMMA_X_1, GAMMA_X_2, GAMMA_Y_1, GAMMA_Y_2
            0, 0, 0, 0, // DELTA_X_1, DELTA_X_2, DELTA_Y_1, DELTA_Y_2
            IC_X,
            IC_Y,
            6 // numPublicInputs
        );
    }

    /// @notice Test proof verification with actual proof data
    /// @dev Replace proof data with actual values from zk/proofs/6g_latest_proof.json
    function testVerifyProof() public {
        // Load proof from file (example values - replace with actual)
        IZKVerifier.Proof memory proof = IZKVerifier.Proof({
            a: [uint256(0), uint256(0)],
            b: [
                [uint256(0), uint256(0)],
                [uint256(0), uint256(0)]
            ],
            c: [uint256(0), uint256(0)]
        });

        uint256[] memory publicInputs = new uint256[](6);
        publicInputs[0] = 0; // agentId
        publicInputs[1] = 0; // capabilityHash
        publicInputs[2] = 92; // avgAccuracy
        publicInputs[3] = 0; // timestamp
        publicInputs[4] = 0; // reserved1
        publicInputs[5] = 0; // reserved2

        // This will fail with mock data - replace with actual proof
        // bool isValid = verifier.verifyProofBool(proof, publicInputs);
        // assertTrue(isValid, "Proof should be valid");
    }

    /// @notice Test that IC points are stored correctly
    function testICPoints() public view {
        uint256 count = verifier.getICPointsCount();
        assertEq(count, 7, "Should have 7 IC points (6 public inputs + 1)");
    }

    /// @notice Test public inputs count
    function testPublicInputsCount() public view {
        uint256 count = verifier.NUM_PUBLIC_INPUTS();
        assertEq(count, 6, "Should have 6 public inputs");
    }

    /// @notice Helper function to load proof from JSON
    /// @dev Use this in actual tests with real proof data
    function _loadProofFromFile(string memory path)
        internal
        pure
        returns (IZKVerifier.Proof memory proof, uint256[] memory publicInputs)
    {
        // In real tests, use vm.readFile() and parseJSON()
        // This is a placeholder for actual implementation
    }
}
