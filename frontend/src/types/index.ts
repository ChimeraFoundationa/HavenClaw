// Type definitions for Agent Coordination Dashboard

export interface ContractInfo {
  name: string;
  address: string;
  description?: string;
  category: ContractCategory;
}

export type ContractCategory = 'core' | 'governance' | 'integration' | 'zk';

export interface AgentInfo {
  name: string;
  tokenId: string;
  erc8004Contract: string;
  tbaAddress: string;
  metadata: string;
  capabilities?: string[];
  reputation?: number;
}

export interface NetworkStats {
  totalContracts: number;
  testsPassed: string;
  testCoverage: string;
  network: string;
  chainId: number;
  status: 'operational' | 'degraded' | 'offline';
}

export interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface FeatureCard {
  title: string;
  description: string;
  icon: string;
  status: 'complete' | 'in-progress' | 'pending';
}
