/**
 * HPP Client - HavenClaw Payment Protocol Client
 * 
 * TypeScript client for interacting with HPP contracts
 */

import { ethers, Contract, Signer, Provider } from 'ethers';

const HPP_ABI = [
  // Agent functions
  'function registerAgent(string calldata metadataURI) external',
  'function getAgent(address agent) external view returns (tuple(address wallet, bool registered, uint256 totalEarned, uint256 completedTasks, string metadataURI) memory)',
  
  // Payment functions
  'function createPayment(address agent, bytes32 conditionHash, uint256 deadline, string calldata metadataURI) external payable returns (uint256)',
  'function createPaymentERC20(address agent, address token, uint256 amount, bytes32 conditionHash, uint256 deadline) external returns (uint256)',
  'function releasePayment(uint256 paymentId, bytes calldata proof) external',
  'function refundPayment(uint256 paymentId) external',
  'function disputePayment(uint256 paymentId, string calldata reason) external',
  
  // View functions
  'function getPayment(uint256 paymentId) external view returns (tuple(uint256 id, address payer, address agent, uint256 amount, address token, bytes32 conditionHash, uint256 deadline, bool released, bool disputed, uint256 createdAt) memory)',
  'function getAgentPayments(address agent) external view returns (uint256[] memory)',
  
  // Events
  'event AgentRegistered(address indexed agent, address indexed wallet, string metadataURI)',
  'event PaymentCreated(uint256 indexed paymentId, address indexed payer, address indexed agent, uint256 amount)',
  'event PaymentReleased(uint256 indexed paymentId, address indexed agent, uint256 amount)',
  'event PaymentDisputed(uint256 indexed paymentId, address indexed disputer, string reason)',
  'event PaymentRefunded(uint256 indexed paymentId, address indexed payer, uint256 amount)',
];

export interface HPPConfig {
  rpcUrl: string;
  hppAddress: string;
  privateKey?: string;
  signer?: Signer;
}

export interface PaymentInfo {
  id: bigint;
  payer: string;
  agent: string;
  amount: bigint;
  token: string;
  conditionHash: string;
  deadline: bigint;
  released: boolean;
  disputed: boolean;
  createdAt: bigint;
}

export interface AgentInfo {
  wallet: string;
  registered: boolean;
  totalEarned: bigint;
  completedTasks: bigint;
  metadataURI: string;
}

export class HPPClient {
  private contract: Contract;
  private signer?: Signer;

  constructor(config: HPPConfig) {
    if (config.signer) {
      this.signer = config.signer;
      this.contract = new Contract(config.hppAddress, HPP_ABI, config.signer);
    } else {
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);
      this.contract = new Contract(config.hppAddress, HPP_ABI, provider);
    }
  }

  /**
   * Create HPP client from config
   */
  static create(config: HPPConfig): HPPClient {
    return new HPPClient(config);
  }

  // ==================== AGENT FUNCTIONS ====================

  /**
   * Register as an agent
   */
  async registerAgent(metadataURI: string) {
    const tx = await this.contract.registerAgent(metadataURI);
    return tx.wait();
  }

  /**
   * Get agent information
   */
  async getAgent(address: string): Promise<AgentInfo> {
    return this.contract.getAgent(address);
  }

  /**
   * Check if address is registered agent
   */
  async isAgent(address: string): Promise<boolean> {
    const agent = await this.getAgent(address);
    return agent.registered;
  }

  // ==================== PAYMENT FUNCTIONS ====================

  /**
   * Create a payment (native token)
   */
  async createPayment(
    agent: string,
    conditionHash: string | Uint8Array,
    deadline: number | bigint,
    metadataURI: string,
    amount: bigint
  ) {
    const tx = await this.contract.createPayment(
      agent,
      typeof conditionHash === 'string' ? conditionHash : conditionHash,
      deadline,
      metadataURI,
      { value: amount }
    );
    const receipt = await tx.wait();
    
    // Parse payment ID from event
    const event = receipt?.logs?.find((log: any) => {
      try {
        return this.contract.interface.parseLog(log)?.name === 'PaymentCreated';
      } catch {
        return false;
      }
    });
    
    const paymentId = event ? this.contract.interface.parseLog(event)?.args.paymentId : null;
    return { paymentId, receipt };
  }

  /**
   * Create a payment (ERC20 token)
   */
  async createPaymentERC20(
    agent: string,
    token: string,
    amount: bigint,
    conditionHash: string | Uint8Array,
    deadline: number | bigint,
    metadataURI: string
  ) {
    const tx = await this.contract.createPaymentERC20(
      agent,
      token,
      amount,
      conditionHash,
      deadline
    );
    const receipt = await tx.wait();
    
    const event = receipt?.logs?.find((log: any) => {
      try {
        return this.contract.interface.parseLog(log)?.name === 'PaymentCreated';
      } catch {
        return false;
      }
    });
    
    const paymentId = event ? this.contract.interface.parseLog(event)?.args.paymentId : null;
    return { paymentId, receipt };
  }

  /**
   * Release payment (agent claims with proof)
   */
  async releasePayment(paymentId: bigint | number, proof: string | Uint8Array) {
    const tx = await this.contract.releasePayment(paymentId, proof);
    return tx.wait();
  }

  /**
   * Refund payment (after deadline)
   */
  async refundPayment(paymentId: bigint | number) {
    const tx = await this.contract.refundPayment(paymentId);
    return tx.wait();
  }

  /**
   * Dispute payment
   */
  async disputePayment(paymentId: bigint | number, reason: string) {
    const tx = await this.contract.disputePayment(paymentId, reason);
    return tx.wait();
  }

  // ==================== VIEW FUNCTIONS ====================

  /**
   * Get payment information
   */
  async getPayment(paymentId: bigint | number): Promise<PaymentInfo> {
    return this.contract.getPayment(paymentId);
  }

  /**
   * Get all payments for an agent
   */
  async getAgentPayments(agent: string): Promise<bigint[]> {
    return this.contract.getAgentPayments(agent);
  }

  /**
   * Check if payment condition is met
   */
  async isConditionMet(paymentId: bigint | number): Promise<boolean> {
    // This would require reading conditionProofs mapping
    // For now, check if payment is released
    const payment = await this.getPayment(paymentId);
    return payment.released;
  }
}
