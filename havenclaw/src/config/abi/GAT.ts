/**
 * GAT Contract ABI
 */

export const GATABI = [
  "event GATPerformed(address indexed agent, bytes32 indexed capability, bool passed, uint256 timestamp)",
  
  "function performTest(address agent, bytes32 capability, tuple(uint256[2] a, uint256[2][2] b, uint256[2] c) proof, uint256[] publicInputs) external",
  "function getGATResult(address agent, bytes32 capability) external view returns (tuple(bool passed, uint256 timestamp, uint256 validUntil) result)",
  "function hasPassedGAT(address agent, bytes32 capability) external view returns (bool)",
  "function getPassedCapabilities(address agent) external view returns (bytes32[])"
] as const
