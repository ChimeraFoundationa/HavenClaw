/**
 * NonCustodialEscrow Contract ABI
 */

export const NonCustodialEscrowABI = [
  "event RequestCreated(bytes32 indexed requestId, address indexed requester, address indexed provider, uint256 amount)",
  "event RequestFunded(bytes32 indexed requestId)",
  "event ProofSubmitted(bytes32 indexed requestId, bytes32 proofHash)",
  "event ProofVerified(bytes32 indexed requestId)",
  "event RequestSettled(bytes32 indexed requestId, address recipient, uint256 amount)",
  "event RequestCancelled(bytes32 indexed requestId, address refundRecipient, uint256 amount)",
  
  "function createRequest(bytes32 capabilityHash, address token, uint256 amount, uint256 deadline) external returns (bytes32 requestId)",
  "function fundRequest(bytes32 requestId) external",
  "function submitProof(bytes32 requestId, bytes32 proofHash) external",
  "function verifyProof(bytes32 requestId) external",
  "function settle(bytes32 requestId) external",
  "function cancel(bytes32 requestId) external",
  "function getRequest(bytes32 requestId) external view returns (tuple(address requester, address provider, address token, uint256 amount, uint256 deadline, bool isFunded, bool isSettled, bool isCancelled) request)"
] as const
