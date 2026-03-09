/**
 * Agent Runtime Configuration Schema
 */

import { z } from 'zod';

export const NetworkConfigSchema = z.object({
  chainId: z.number(),
  rpcUrl: z.string().url(),
  wsUrl: z.string().url().optional(),
  explorerUrl: z.string().url().optional(),
});

export const IdentityConfigSchema = z.object({
  operatorPrivateKey: z.string().startsWith('0x'),
  erc8004TokenId: z.bigint().optional(),
  tbaAddress: z.string().optional(),
});

export const ContractAddressesSchema = z.object({
  agentRegistry: z.string(),
  agentReputation: z.string(),
  havenGovernance: z.string(),
  taskMarketplace: z.string(),
  havenToken: z.string(),
  erc8004Registry: z.string().optional(),
  erc6551Registry: z.string().optional(),
  gat: z.string().optional(),
  escrow: z.string().optional(),
});

export const DecisionConfigSchema = z.object({
  pollingInterval: z.number().default(5000),
  maxGasPrice: z.bigint().optional(),
  autoVote: z.boolean().default(false),
  autoAcceptTasks: z.boolean().default(false),
  minTaskReward: z.bigint().default(0n),
  votingRules: z.object({
    minQuorum: z.bigint().default(0n),
    maxAgainstRatio: z.number().default(0.5),
    trustedProposers: z.array(z.string()).default([]),
  }).default({}),
});

export const LoggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  format: z.enum(['json', 'text']).default('json'),
});

export const AgentConfigSchema = z.object({
  agentId: z.string().min(1),
  identity: IdentityConfigSchema,
  network: NetworkConfigSchema,
  contracts: ContractAddressesSchema,
  decision: DecisionConfigSchema,
  logging: LoggingConfigSchema,
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
export type IdentityConfig = z.infer<typeof IdentityConfigSchema>;
export type ContractAddresses = z.infer<typeof ContractAddressesSchema>;
export type DecisionConfig = z.infer<typeof DecisionConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;

/**
 * Validate and load agent configuration
 */
export function loadConfig(config: unknown): AgentConfig {
  return AgentConfigSchema.parse(config);
}

export function loadConfigSafe(config: unknown): AgentConfig | null {
  const result = AgentConfigSchema.safeParse(config);
  return result.success ? result.data : null;
}
