// src/HavenClient.ts
import { ethers, Contract } from "ethers";

// src/contracts/abi.ts
var AgentRegistryABI = [
  "function registerAgent(string metadataURI, bytes32[] capabilities) external",
  "function updateMetadata(string newMetadataURI) external",
  "function updateCapabilities(bytes32[] newCapabilities) external",
  "function getAgent(address agent) external view returns (tuple(address agentAddress, string metadataURI, bytes32[] capabilities, uint256 registeredAt, uint256 verifiedAt, bool exists) info)",
  "function isRegistered(address agent) external view returns (bool)",
  "function isVerified(address agent) external view returns (bool)",
  "function getCapabilities(address agent) external view returns (bytes32[])",
  "event AgentRegistered(address indexed agentAddress, string metadataURI, bytes32[] capabilities, uint256 timestamp)",
  "event AgentMetadataUpdated(address indexed agentAddress, string oldURI, string newURI, uint256 timestamp)",
  "event AgentCapabilitiesUpdated(address indexed agentAddress, bytes32[] capabilities, uint256 timestamp)",
  "event AgentVerified(address indexed agentAddress, bytes32 proofHash, uint256 timestamp)"
];
var AgentReputationABI = [
  "function stake(uint256 amount, uint256 lockPeriod) external",
  "function withdraw(uint256 amount) external",
  "function getReputation(address agent) external view returns (tuple(uint256 score, uint256 tasksCompleted, uint256 tasksFailed, uint256 totalEarnings, uint256 stakedAmount, uint256 unlockTime) info)",
  "function getScore(address agent) external view returns (uint256)",
  "function getStakedAmount(address agent) external view returns (uint256)",
  "function getVotingPower(address account) external view returns (uint256)",
  "function canWithdraw(address agent) external view returns (bool)",
  "event ReputationUpdated(address indexed agent, int256 delta, uint256 newScore)",
  "event TokensStaked(address indexed agent, uint256 amount, uint256 unlockTime)",
  "event TokensWithdrawn(address indexed agent, uint256 amount)",
  "event TaskCompleted(address indexed agent, uint256 reward)",
  "event TaskFailed(address indexed agent, uint256 penalty)"
];
var HavenGovernanceABI = [
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) external returns (uint256)",
  "function castVote(uint256 proposalId, uint8 support) external returns (uint256)",
  "function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) external returns (uint256)",
  "function getVotes(address account) external view returns (uint256)",
  "function getPastVotes(address account, uint256 blockNumber) external view returns (uint256)",
  "function proposalCount() external view returns (uint256)",
  "function state(uint256 proposalId) external view returns (uint8)",
  "function proposalDeadline(uint256 proposalId) external view returns (uint256)",
  "function proposalSnapshot(uint256 proposalId) external view returns (uint256)",
  "function quorum(uint256 blockNumber) external view returns (uint256)",
  "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description)",
  "event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight, string reason)",
  "event ProposalExecuted(uint256 indexed proposalId)",
  "event ProposalCanceled(uint256 indexed proposalId)"
];
var TaskMarketplaceABI = [
  "function createTask(string description, bytes32 requiredCapability, uint256 reward, address rewardToken, uint256 deadline) external payable returns (uint256)",
  "function acceptTask(uint256 taskId) external",
  "function completeTask(uint256 taskId, string resultURI) external",
  "function claimReward(uint256 taskId) external",
  "function cancelTask(uint256 taskId) external",
  "function getTask(uint256 taskId) external view returns (tuple(uint256 taskId, address creator, address solver, string description, bytes32 requiredCapability, uint256 reward, address rewardToken, uint8 status, uint256 createdAt, uint256 deadline, string resultURI) task)",
  "function getTaskCount() external view returns (uint256)",
  "event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 reward)",
  "event TaskAccepted(uint256 indexed taskId, address indexed solver)",
  "event TaskCompleted(uint256 indexed taskId, string resultURI)",
  "event TaskRewardClaimed(uint256 indexed taskId, address indexed claimer)",
  "event TaskCancelled(uint256 indexed taskId)"
];
var HAVENABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function mint(address to, uint256 amount) external",
  "function burn(uint256 amount) external",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];
var ERC6551RegistryABI = [
  "function createAccount(address implementation, uint256 chainId, address tokenContract, uint256 tokenId, uint256 salt) external returns (address)",
  "function account(address implementation, uint256 chainId, address tokenContract, uint256 tokenId, uint256 salt) external view returns (address)",
  "event AccountCreated(address indexed account, address indexed implementation, uint256 chainId, address indexed tokenContract, uint256 tokenId)"
];
var ERC8004RegistryABI = [
  "function mint(address to, string metadataURI) external returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function isRegistered(uint256 tokenId) external view returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// src/HavenClient.ts
var HavenClient = class {
  provider;
  signer;
  contracts;
  // Contract instances (read-only by default)
  agentRegistry;
  agentReputation;
  havenGovernance;
  taskMarketplace;
  havenToken;
  erc6551Registry;
  erc8004Registry;
  constructor(config) {
    this.contracts = config.contracts;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.agentRegistry = this._createContract(
      config.contracts.agentRegistry,
      AgentRegistryABI
    );
    this.agentReputation = this._createContract(
      config.contracts.agentReputation,
      AgentReputationABI
    );
    this.havenGovernance = this._createContract(
      config.contracts.havenGovernance,
      HavenGovernanceABI
    );
    this.taskMarketplace = this._createContract(
      config.contracts.taskMarketplace,
      TaskMarketplaceABI
    );
    this.havenToken = this._createContract(
      config.contracts.havenToken,
      HAVENABI
    );
    if (config.contracts.erc6551Registry) {
      this.erc6551Registry = this._createContract(
        config.contracts.erc6551Registry,
        ERC6551RegistryABI
      );
    }
    if (config.contracts.erc8004Registry) {
      this.erc8004Registry = this._createContract(
        config.contracts.erc8004Registry,
        ERC8004RegistryABI
      );
    }
  }
  /**
   * Connect a signer to enable write operations
   */
  async connectSigner(signer) {
    this.signer = signer;
    this.agentRegistry = this._createContract(
      this.contracts.agentRegistry,
      AgentRegistryABI,
      signer
    );
    this.agentReputation = this._createContract(
      this.contracts.agentReputation,
      AgentReputationABI,
      signer
    );
    this.havenGovernance = this._createContract(
      this.contracts.havenGovernance,
      HavenGovernanceABI,
      signer
    );
    this.taskMarketplace = this._createContract(
      this.contracts.taskMarketplace,
      TaskMarketplaceABI,
      signer
    );
    this.havenToken = this._createContract(
      this.contracts.havenToken,
      HAVENABI,
      signer
    );
    if (this.erc6551Registry && this.contracts.erc6551Registry) {
      this.erc6551Registry = this._createContract(
        this.contracts.erc6551Registry,
        ERC6551RegistryABI,
        signer
      );
    }
    if (this.erc8004Registry && this.contracts.erc8004Registry) {
      this.erc8004Registry = this._createContract(
        this.contracts.erc8004Registry,
        ERC8004RegistryABI,
        signer
      );
    }
  }
  /**
   * Get network information
   */
  async getNetworkInfo() {
    const network = await this.provider.getNetwork();
    return {
      chainId: network.chainId,
      name: this._getNetworkName(Number(network.chainId))
    };
  }
  /**
   * Get current block number
   */
  async getBlockNumber() {
    return BigInt(await this.provider.getBlockNumber());
  }
  /**
   * Get balance of an address (ETH/AVAX)
   */
  async getBalance(address) {
    return this.provider.getBalance(address);
  }
  /**
   * Get HAVEN token balance
   */
  async getHAVENBalance(address) {
    return this.havenToken.balanceOf(address);
  }
  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash, confirmations = 1) {
    const receipt = await this.provider.waitForTransaction(txHash, confirmations);
    if (!receipt) {
      throw new Error(`Transaction receipt not found for ${txHash}`);
    }
    return receipt;
  }
  /**
   * Get gas price data
   */
  async getFeeData() {
    return this.provider.getFeeData();
  }
  /**
   * Get nonce for an address
   */
  async getTransactionCount(address) {
    return this.provider.getTransactionCount(address);
  }
  /**
   * Estimate gas for a transaction
   */
  async estimateGas(to, data, value) {
    return this.provider.estimateGas({ to, data, value });
  }
  /**
   * Call a contract read function
   */
  async callContract(contractAddress, abi, functionName, args) {
    const contract = this._createContract(contractAddress, abi);
    return contract[functionName](...args || []);
  }
  _createContract(address, abi, signerOrProvider) {
    return new Contract(address, abi, signerOrProvider || this.provider);
  }
  _getNetworkName(chainId) {
    const networks = {
      43113: "Avalanche Fuji Testnet",
      43114: "Avalanche C-Chain",
      1: "Ethereum Mainnet",
      5: "Goerli Testnet"
    };
    return networks[chainId] || `Unknown (${chainId})`;
  }
};

// src/events/EventListener.ts
var EventListener = class {
  client;
  eventEmitter;
  config;
  subscriptions;
  running = false;
  constructor(client, eventEmitter, config = {}) {
    this.client = client;
    this.eventEmitter = eventEmitter;
    this.config = {
      pollingInterval: config.pollingInterval || 5e3,
      fromBlock: config.fromBlock,
      enabled: {
        governance: true,
        tasks: true,
        reputation: true,
        agentRegistry: true,
        ...config.enabled
      }
    };
    this.subscriptions = /* @__PURE__ */ new Map();
  }
  /**
   * Start listening for events
   */
  async start() {
    if (this.running) {
      return;
    }
    this.running = true;
    const fromBlock = this.config.fromBlock ?? await this.client.getBlockNumber();
    if (this.config.enabled?.governance) {
      await this.subscribeToGovernance(fromBlock);
    }
    if (this.config.enabled?.tasks) {
      await this.subscribeToTasks(fromBlock);
    }
    if (this.config.enabled?.reputation) {
      await this.subscribeToReputation(fromBlock);
    }
    if (this.config.enabled?.agentRegistry) {
      await this.subscribeToAgentRegistry(fromBlock);
    }
  }
  /**
   * Stop listening for events
   */
  async stop() {
    if (!this.running) {
      return;
    }
    this.running = false;
    for (const [, sub] of this.subscriptions.entries()) {
      sub.remove();
    }
    this.subscriptions.clear();
  }
  /**
   * Subscribe to governance events
   */
  async subscribeToGovernance(_fromBlock) {
    const filter = this.client.havenGovernance.filters.ProposalCreated();
    const listener = async (...args) => {
      const event = args[args.length - 1];
      const proposalEvent = {
        proposalId: event.args.proposalId,
        proposer: event.args.proposer,
        description: event.args.description,
        targets: [],
        // Would need to query full proposal details
        calldatas: [],
        startBlock: 0n,
        endBlock: 0n
      };
      this.eventEmitter.emit("governance:proposal", proposalEvent);
    };
    const provider = this.client.provider;
    await provider.on(filter, listener);
    this.subscriptions.set("governance", {
      name: "governance",
      remove: () => {
        provider.off(filter, listener);
      }
    });
    const voteFilter = this.client.havenGovernance.filters.VoteCast();
    const voteListener = async (...args) => {
      const event = args[args.length - 1];
      const voteEvent = {
        proposalId: event.args.proposalId,
        voter: event.args.voter,
        support: event.args.support,
        votingPower: event.args.weight,
        reason: event.args.reason
      };
      this.eventEmitter.emit("governance:vote", voteEvent);
    };
    await provider.on(voteFilter, voteListener);
    this.subscriptions.set("governance-vote", {
      name: "governance-vote",
      remove: () => {
        provider.off(voteFilter, voteListener);
      }
    });
  }
  /**
   * Subscribe to task events
   */
  async subscribeToTasks(_fromBlock) {
    const provider = this.client.provider;
    const taskFilter = this.client.taskMarketplace.filters.TaskCreated();
    const taskListener = async (...args) => {
      const event = args[args.length - 1];
      const taskId = event.args.taskId;
      const task = await this.client.taskMarketplace.getTask(taskId);
      const taskEvent = {
        taskId,
        creator: task.creator,
        description: task.description,
        requiredCapability: this._bytes32ToString(
          task.requiredCapability
        ),
        reward: task.reward,
        rewardToken: task.rewardToken,
        deadline: task.deadline
      };
      this.eventEmitter.emit("task:created", taskEvent);
    };
    await provider.on(taskFilter, taskListener);
    this.subscriptions.set("task-created", {
      name: "task-created",
      remove: () => {
        provider.off(taskFilter, taskListener);
      }
    });
    const completeFilter = this.client.taskMarketplace.filters.TaskCompleted();
    const completeListener = async (...args) => {
      const event = args[args.length - 1];
      const taskId = event.args.taskId;
      const task = await this.client.taskMarketplace.getTask(taskId);
      const taskEvent = {
        taskId,
        creator: task.creator,
        description: task.description,
        requiredCapability: this._bytes32ToString(
          task.requiredCapability
        ),
        reward: task.reward,
        rewardToken: task.rewardToken,
        deadline: task.deadline
      };
      this.eventEmitter.emit("task:completed", taskEvent);
    };
    await provider.on(completeFilter, completeListener);
    this.subscriptions.set("task-completed", {
      name: "task-completed",
      remove: () => {
        provider.off(completeFilter, completeListener);
      }
    });
  }
  /**
   * Subscribe to reputation events
   */
  async subscribeToReputation(_fromBlock) {
    const provider = this.client.provider;
    const stakeFilter = this.client.agentReputation.filters.TokensStaked();
    const stakeListener = async (...args) => {
      const event = args[args.length - 1];
      this.eventEmitter.emit("runtime:state-change", {
        type: "stake",
        agent: event.args.agent,
        amount: event.args.amount,
        unlockTime: event.args.unlockTime
      });
    };
    await provider.on(stakeFilter, stakeListener);
    this.subscriptions.set("reputation-stake", {
      name: "reputation-stake",
      remove: () => {
        provider.off(stakeFilter, stakeListener);
      }
    });
    const repFilter = this.client.agentReputation.filters.ReputationUpdated();
    const repListener = async (...args) => {
      const event = args[args.length - 1];
      this.eventEmitter.emit("runtime:state-change", {
        type: "reputation",
        agent: event.args.agent,
        delta: event.args.delta,
        newScore: event.args.newScore
      });
    };
    await provider.on(repFilter, repListener);
    this.subscriptions.set("reputation-update", {
      name: "reputation-update",
      remove: () => {
        provider.off(repFilter, repListener);
      }
    });
  }
  /**
   * Subscribe to agent registry events
   */
  async subscribeToAgentRegistry(_fromBlock) {
    const provider = this.client.provider;
    const agentFilter = this.client.agentRegistry.filters.AgentRegistered();
    const agentListener = async (...args) => {
      const event = args[args.length - 1];
      this.eventEmitter.emit("runtime:state-change", {
        type: "agent-registered",
        agentAddress: event.args.agentAddress,
        metadataURI: event.args.metadataURI,
        capabilities: event.args.capabilities,
        timestamp: event.args.timestamp
      });
    };
    await provider.on(agentFilter, agentListener);
    this.subscriptions.set("agent-registered", {
      name: "agent-registered",
      remove: () => {
        provider.off(agentFilter, agentListener);
      }
    });
  }
  /**
   * Get active subscription count
   */
  getSubscriptionCount() {
    return this.subscriptions.size;
  }
  /**
   * Check if listener is running
   */
  isRunning() {
    return this.running;
  }
  _bytes32ToString(bytes32) {
    const hex = bytes32.replace(/^0x/, "");
    let str = "";
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substr(i, 2), 16);
      if (code === 0) break;
      str += String.fromCharCode(code);
    }
    return str;
  }
};

// src/state/StateReader.ts
var Cache = class {
  cache;
  ttl;
  maxSize;
  constructor(config = { ttl: 3e4, maxSize: 1e3 }) {
    this.cache = /* @__PURE__ */ new Map();
    this.ttl = config.ttl;
    this.maxSize = config.maxSize;
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  delete(key) {
    return this.cache.delete(key);
  }
  clear() {
    this.cache.clear();
  }
  size() {
    return this.cache.size;
  }
  /**
   * Get or compute value
   */
  async getOrCompute(key, compute) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }
    const value = await compute();
    this.set(key, value);
    return value;
  }
};
var StateReader = class {
  client;
  cache;
  constructor(client, cacheConfig) {
    this.client = client;
    this.cache = new Cache(cacheConfig);
  }
  /**
   * Get agent registration info
   */
  async getAgentInfo(agentAddress) {
    const cacheKey = `agent:${agentAddress.toLowerCase()}`;
    return this.cache.getOrCompute(cacheKey, async () => {
      const isRegistered = await this.client.agentRegistry.isRegistered(
        agentAddress
      );
      if (!isRegistered) {
        return null;
      }
      const info = await this.client.agentRegistry.getAgent(agentAddress);
      return {
        agentAddress: info.agentAddress,
        metadataURI: info.metadataURI,
        capabilities: info.capabilities.map(
          (c) => this._bytes32ToString(c)
        ),
        registeredAt: info.registeredAt,
        verifiedAt: info.verifiedAt,
        exists: info.exists
      };
    });
  }
  /**
   * Get agent reputation info
   */
  async getReputationInfo(agentAddress) {
    const cacheKey = `reputation:${agentAddress.toLowerCase()}`;
    return this.cache.getOrCompute(cacheKey, async () => {
      const info = await this.client.agentReputation.getReputation(agentAddress);
      return {
        score: info.score,
        tasksCompleted: info.tasksCompleted,
        tasksFailed: info.tasksFailed,
        totalEarnings: info.totalEarnings,
        stakedAmount: info.stakedAmount,
        unlockTime: info.unlockTime
      };
    });
  }
  /**
   * Get proposal info
   */
  async getProposalInfo(proposalId) {
    const cacheKey = `proposal:${proposalId}`;
    return this.cache.getOrCompute(cacheKey, async () => {
      const state = await this.client.havenGovernance.state(proposalId);
      const startBlock = await this.client.havenGovernance.proposalSnapshot(
        proposalId
      );
      const endBlock = await this.client.havenGovernance.proposalDeadline(
        proposalId
      );
      return {
        proposalId,
        state: Number(state),
        startBlock,
        endBlock
      };
    });
  }
  /**
   * Get task info
   */
  async getTaskInfo(taskId) {
    const cacheKey = `task:${taskId}`;
    return this.cache.getOrCompute(cacheKey, async () => {
      try {
        const task = await this.client.taskMarketplace.getTask(taskId);
        return {
          taskId: task.taskId,
          creator: task.creator,
          solver: task.solver,
          description: task.description,
          requiredCapability: this._bytes32ToString(
            task.requiredCapability
          ),
          reward: task.reward,
          rewardToken: task.rewardToken,
          status: Number(task.status),
          createdAt: task.createdAt,
          deadline: task.deadline,
          resultURI: task.resultURI
        };
      } catch {
        return null;
      }
    });
  }
  /**
   * Get all active proposals
   */
  async getActiveProposals() {
    const proposalCount = await this.client.havenGovernance.proposalCount();
    const active = [];
    for (let i = 1n; i <= proposalCount; i++) {
      const state = await this.client.havenGovernance.state(i);
      if (state === 1n) {
        active.push(await this.getProposalInfo(i));
      }
    }
    return active;
  }
  /**
   * Get all open tasks
   */
  async getOpenTasks() {
    const taskCount = await this.client.taskMarketplace.getTaskCount();
    const open = [];
    for (let i = 1n; i <= taskCount; i++) {
      const task = await this.getTaskInfo(i);
      if (task && task.status === 0) {
        open.push(task);
      }
    }
    return open;
  }
  /**
   * Get agent voting power
   */
  async getVotingPower(agentAddress) {
    return this.client.agentReputation.getVotingPower(agentAddress);
  }
  /**
   * Get HAVEN token balance
   */
  async getHAVENBalance(address) {
    return this.client.getHAVENBalance(address);
  }
  /**
   * Invalidate cache for a specific key
   */
  invalidate(key) {
    this.cache.delete(key);
  }
  /**
   * Clear entire cache
   */
  clearCache() {
    this.cache.clear();
  }
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size(),
      maxSize: this.cache.maxSize
    };
  }
  _bytes32ToString(bytes32) {
    const hex = bytes32.replace(/^0x/, "");
    let str = "";
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substr(i, 2), 16);
      if (code === 0) break;
      str += String.fromCharCode(code);
    }
    return str;
  }
};

// src/contracts/addresses.ts
var FUJI_CONTRACTS = {
  agentRegistry: "0x58EcC1A3B5a9c78f59A594120405058FB40a3201",
  agentReputation: "0x662BdE306632F8923ADcb6aBEEbD3bCAf5400AaC",
  havenGovernance: "0x283C8AEB114d2025A48C064eb99FEb6248c4E6f",
  taskMarketplace: "0xFbD804508Ad7C65aE5D23090018eB2eE400ea1e5",
  havenToken: "0x0f847172d1C496dd847d893A0318dBF4B826ef63",
  erc8004Registry: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  erc6551Registry: "0xaCA0fA40b2eaAdcdF1c72cB36e88aBd76C0EA464",
  gat: "0xa91393D9f9A770e70E02128BCF6b2413Ca391212",
  escrow: "0xC4Bb287c74FF92cD4B0c62D51523a03FD0F0C543"
};
function getContractAddresses(chainId) {
  if (chainId === 43113) {
    return FUJI_CONTRACTS;
  }
  return FUJI_CONTRACTS;
}
export {
  AgentRegistryABI,
  AgentReputationABI,
  Cache,
  ERC6551RegistryABI,
  ERC8004RegistryABI,
  EventListener,
  FUJI_CONTRACTS,
  HAVENABI,
  HavenClient,
  HavenGovernanceABI,
  StateReader,
  TaskMarketplaceABI,
  getContractAddresses
};
