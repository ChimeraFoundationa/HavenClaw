/**
 * AgentRegistry Contract ABI
 */

export const AgentRegistryABI = [
  "event AgentRegistered(address indexed agent, string metadataURI, bytes32[] capabilities)",
  "event MetadataUpdated(address indexed agent, string newMetadataURI)",
  "event CapabilitiesUpdated(address indexed agent, bytes32[] newCapabilities)",
  "event AgentVerified(address indexed agent, bytes32 capability)",
  
  "function registerAgent(string metadataURI, bytes32[] capabilities) external",
  "function updateMetadata(string metadataURI) external",
  "function updateCapabilities(bytes32[] capabilities) external",
  "function getAgent(address agent) external view returns (tuple(string metadataURI, bool isVerified, uint256 registeredAt) agentInfo)",
  "function isRegistered(address agent) external view returns (bool)",
  "function isVerified(address agent) external view returns (bool)",
  "function getCapabilities(address agent) external view returns (bytes32[])"
] as const
