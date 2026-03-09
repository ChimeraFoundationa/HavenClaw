/**
 * @havenclaw/haven-interface
 * 
 * HAVEN Protocol integration layer
 */

export { HavenClient } from './HavenClient.js';
export { EventListener } from './events/EventListener.js';
export { StateReader, Cache } from './state/StateReader.js';

export type {
  HavenClientConfig,
  NetworkInfo,
} from './HavenClient.js';

export type {
  EventListenerConfig,
  EventSubscription,
} from './events/EventListener.js';

export type {
  CacheConfig,
  AgentInfo,
  ReputationInfo,
  ProposalInfo,
  TaskInfo,
  ProposalState,
  TaskStatus,
} from './state/StateReader.js';

export {
  FUJI_CONTRACTS,
  getContractAddresses,
} from './contracts/addresses.js';

export type { ContractAddresses } from './contracts/addresses.js';

export {
  AgentRegistryABI,
  AgentReputationABI,
  HavenGovernanceABI,
  TaskMarketplaceABI,
  HAVENABI,
  ERC6551RegistryABI,
  ERC8004RegistryABI,
} from './contracts/abi.js';
