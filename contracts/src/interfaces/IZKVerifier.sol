// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IZKVerifier
 * @dev Simple ZK verifier interface for OpenClaw Protocol
 */
interface IZKVerifier {
    /**
     * @dev Verify a ZK proof
     * @param proof Raw proof bytes
     * @param publicInputs Public inputs as bytes32 array
     * @return valid Whether the proof is valid
     */
    function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view returns (bool valid);
    
    /**
     * @dev Get number of public inputs expected
     */
    function NUM_PUBLIC_INPUTS() external view returns (uint256);
}
