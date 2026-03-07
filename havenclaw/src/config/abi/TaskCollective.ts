/**
 * TaskCollective Contract ABI
 */

export const TaskCollectiveABI = [
  "event ProposalCreated(uint256 indexed proposalId, address indexed creator, string description)",
  "event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 support, uint256 votingPower)",
  "event ProposalExecuted(uint256 indexed proposalId)",
  
  "function createProposal(string description) external returns (uint256 proposalId)",
  "function vote(uint256 proposalId, uint8 support) external",
  "function executeProposal(uint256 proposalId) external",
  "function getProposal(uint256 proposalId) external view returns (tuple(string description, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool executed, uint256 deadline) proposal)",
  "function delegate(address delegatee) external",
  "function getVotingPower(address account) external view returns (uint256)"
] as const
