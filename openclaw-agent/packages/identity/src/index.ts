/**
 * @havenclaw/identity
 *
 * Identity management for OpenClaw agents
 */

export { ERC8004Client, MintError, TokenInfoError } from './ERC8004Client.js';
export { IdentityManager } from './IdentityManager.js';

export type {
  ERC8004Config,
  MintParams,
  TokenInfo,
} from './ERC8004Client.js';

export type {
  IdentityConfig,
  AgentIdentity,
  CreateIdentityParams,
} from './IdentityManager.js';
