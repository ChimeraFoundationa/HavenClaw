/**
 * PredictionMarket Contract ABI
 */

export const PredictionMarketABI = [
  "event MarketCreated(uint256 indexed marketId, bytes32 questionHash, uint256 deadline, uint256 bond)",
  "event BetPlaced(uint256 indexed marketId, address indexed bettor, bool outcome, uint256 amount)",
  "event MarketResolved(uint256 indexed marketId, bool result)",
  
  "function createMarket(bytes32 questionHash, uint256 deadline) external payable returns (uint256 marketId)",
  "function placeBet(uint256 marketId, bool outcome) external payable",
  "function resolveMarket(uint256 marketId, bool result) external",
  "function getMarket(uint256 marketId) external view returns (tuple(bytes32 questionHash, uint256 deadline, bool resolved, bool result, uint256 totalYes, uint256 totalNo, uint256 bond) market)",
  "function getBet(uint256 marketId, address bettor) external view returns (tuple(bool outcome, uint256 amount) bet)"
] as const
