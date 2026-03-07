/**
 * AgentReputation Contract ABI
 */

export const AgentReputationABI = [
  "event Staked(address indexed agent, uint256 amount, uint256 lockPeriod, uint256 unlockTime)",
  "event Withdrawn(address indexed agent, uint256 amount)",
  "event ReputationUpdated(address indexed agent, int256 delta, uint256 newScore)",
  
  "function stake(uint256 amount, uint256 lockPeriod) external",
  "function withdraw(uint256 amount) external",
  "function getStake(address agent) external view returns (uint256 amount, uint256 unlockTime)",
  "function getReputation(address agent) external view returns (uint256 score)",
  "function updateReputation(address agent, int256 delta) external"
] as const
