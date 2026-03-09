// src/TaskClient.ts
import { ethers, Contract } from "ethers";

// abi/TaskMarketplace.json
var TaskMarketplace_default = [
  {
    type: "constructor",
    inputs: [
      {
        name: "initialOwner",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "receive",
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "acceptTask",
    inputs: [
      {
        name: "taskId",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "cancelTask",
    inputs: [
      {
        name: "taskId",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "completeTask",
    inputs: [
      {
        name: "taskId",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "resultURI",
        type: "string",
        internalType: "string"
      },
      {
        name: "proof",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "createTask",
    inputs: [
      {
        name: "description",
        type: "string",
        internalType: "string"
      },
      {
        name: "requiredCapability",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "reward",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "rewardToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "deadline",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "disputeTask",
    inputs: [
      {
        name: "taskId",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "reason",
        type: "string",
        internalType: "string"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getCreatedTasks",
    inputs: [
      {
        name: "creator",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256[]",
        internalType: "uint256[]"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getOpenTasks",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256[]",
        internalType: "uint256[]"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getSolverTasks",
    inputs: [
      {
        name: "solver",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256[]",
        internalType: "uint256[]"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getTask",
    inputs: [
      {
        name: "taskId",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IOpenClawTaskMarketplace.Task",
        components: [
          {
            name: "taskId",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "creator",
            type: "address",
            internalType: "address"
          },
          {
            name: "solver",
            type: "address",
            internalType: "address"
          },
          {
            name: "description",
            type: "string",
            internalType: "string"
          },
          {
            name: "requiredCapability",
            type: "bytes32",
            internalType: "bytes32"
          },
          {
            name: "reward",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "rewardToken",
            type: "address",
            internalType: "address"
          },
          {
            name: "status",
            type: "uint8",
            internalType: "enum IOpenClawTaskMarketplace.TaskStatus"
          },
          {
            name: "createdAt",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "deadline",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "resultURI",
            type: "string",
            internalType: "string"
          },
          {
            name: "completedAt",
            type: "uint256",
            internalType: "uint256"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getTaskBids",
    inputs: [
      {
        name: "taskId",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct IOpenClawTaskMarketplace.TaskBid[]",
        components: [
          {
            name: "taskId",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "bidder",
            type: "address",
            internalType: "address"
          },
          {
            name: "proposedReward",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "estimatedCompletionTime",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "capabilities",
            type: "bytes32[]",
            internalType: "bytes32[]"
          },
          {
            name: "bidAt",
            type: "uint256",
            internalType: "uint256"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getTaskStatus",
    inputs: [
      {
        name: "taskId",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum IOpenClawTaskMarketplace.TaskStatus"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "registry",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IOpenClawRegistry"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setPlatformFee",
    inputs: [
      {
        name: "feeBps",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setRegistry",
    inputs: [
      {
        name: "_registry",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setZKVerifier",
    inputs: [
      {
        name: "verifier",
        type: "address",
        internalType: "address"
      },
      {
        name: "enabled",
        type: "bool",
        internalType: "bool"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "submitBid",
    inputs: [
      {
        name: "taskId",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "proposedReward",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "estimatedCompletionTime",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "capabilities",
        type: "bytes32[]",
        internalType: "bytes32[]"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "zkEnabled",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "zkVerifier",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IZKVerifier"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "PlatformFeeUpdated",
    inputs: [
      {
        name: "newFeeBps",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RegistrySet",
    inputs: [
      {
        name: "registry",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RewardClaimed",
    inputs: [
      {
        name: "taskId",
        type: "uint256",
        indexed: true,
        internalType: "uint256"
      },
      {
        name: "solver",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TaskAccepted",
    inputs: [
      {
        name: "taskId",
        type: "uint256",
        indexed: true,
        internalType: "uint256"
      },
      {
        name: "solver",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "acceptedAt",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TaskBidSubmitted",
    inputs: [
      {
        name: "taskId",
        type: "uint256",
        indexed: true,
        internalType: "uint256"
      },
      {
        name: "bidder",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "proposedReward",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TaskCancelled",
    inputs: [
      {
        name: "taskId",
        type: "uint256",
        indexed: true,
        internalType: "uint256"
      },
      {
        name: "creator",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TaskCompleted",
    inputs: [
      {
        name: "taskId",
        type: "uint256",
        indexed: true,
        internalType: "uint256"
      },
      {
        name: "solver",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "resultURI",
        type: "string",
        indexed: false,
        internalType: "string"
      },
      {
        name: "completedAt",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TaskCreated",
    inputs: [
      {
        name: "taskId",
        type: "uint256",
        indexed: true,
        internalType: "uint256"
      },
      {
        name: "creator",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "description",
        type: "string",
        indexed: false,
        internalType: "string"
      },
      {
        name: "reward",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TaskDisputed",
    inputs: [
      {
        name: "taskId",
        type: "uint256",
        indexed: true,
        internalType: "uint256"
      },
      {
        name: "creator",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "reason",
        type: "string",
        indexed: false,
        internalType: "string"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ZKVerifierSet",
    inputs: [
      {
        name: "verifier",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "enabled",
        type: "bool",
        indexed: false,
        internalType: "bool"
      }
    ],
    anonymous: false
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address"
      }
    ]
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      }
    ]
  },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address"
      }
    ]
  }
];

// src/TaskClient.ts
var TaskClient = class _TaskClient {
  contract;
  signer;
  constructor(address, providerOrSigner) {
    try {
      this.signer = providerOrSigner;
      this.contract = new Contract(address, TaskMarketplace_default, this.signer);
    } catch {
      this.contract = new Contract(address, TaskMarketplace_default, providerOrSigner);
    }
  }
  async connect(signer) {
    return new _TaskClient(await this.getAddress(), signer);
  }
  async getAddress() {
    return this.contract.getAddress();
  }
  /**
   * Create a new task
   */
  async createTask(params) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    const capabilityHash = ethers.id(params.requiredCapability);
    if (params.rewardToken === ethers.ZeroAddress) {
      return this.contract.createTask(
        params.description,
        capabilityHash,
        params.reward,
        params.rewardToken,
        params.deadline,
        { value: params.reward }
      );
    } else {
      return this.contract.createTask(
        params.description,
        capabilityHash,
        params.reward,
        params.rewardToken,
        params.deadline
      );
    }
  }
  /**
   * Accept a task
   */
  async acceptTask(taskId) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    return this.contract.acceptTask(taskId);
  }
  /**
   * Complete a task
   */
  async completeTask(taskId, resultUri, proof) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    return this.contract.completeTask(taskId, resultUri, proof || "0x");
  }
  /**
   * Dispute a task
   */
  async disputeTask(taskId, reason) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    return this.contract.disputeTask(taskId, reason);
  }
  /**
   * Cancel a task
   */
  async cancelTask(taskId) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    return this.contract.cancelTask(taskId);
  }
  /**
   * Submit a bid for a task
   */
  async submitBid(taskId, proposedReward, estimatedCompletionTime, capabilities) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    const capabilityHashes = capabilities.map((c) => ethers.id(c));
    return this.contract.submitBid(
      taskId,
      proposedReward,
      estimatedCompletionTime,
      capabilityHashes
    );
  }
  /**
   * Get task information
   */
  async getTask(taskId) {
    try {
      const task = await this.contract.getTask(taskId);
      return {
        taskId: task.taskId,
        creator: task.creator,
        solver: task.solver,
        description: task.description,
        requiredCapability: task.requiredCapability,
        reward: task.reward,
        rewardToken: task.rewardToken,
        status: task.status,
        createdAt: task.createdAt,
        deadline: task.deadline,
        resultUri: task.resultUri,
        completedAt: task.completedAt
      };
    } catch {
      return null;
    }
  }
  /**
   * Get task status
   */
  async getTaskStatus(taskId) {
    return this.contract.getTaskStatus(taskId);
  }
  /**
   * Get all open tasks
   */
  async getOpenTasks() {
    return this.contract.getOpenTasks();
  }
  /**
   * Get bids for a task
   */
  async getTaskBids(taskId) {
    const bids = await this.contract.getTaskBids(taskId);
    return bids.map((bid) => ({
      taskId: bid.taskId,
      bidder: bid.bidder,
      proposedReward: bid.proposedReward,
      estimatedCompletionTime: bid.estimatedCompletionTime,
      capabilities: bid.capabilities,
      bidAt: bid.bidAt
    }));
  }
  /**
   * Get tasks created by an address
   */
  async getCreatedTasks(creator) {
    return this.contract.getCreatedTasks(creator);
  }
  /**
   * Get tasks solved by an address
   */
  async getSolverTasks(solver) {
    return this.contract.getSolverTasks(solver);
  }
  /**
   * Get platform fee (in basis points)
   */
  async getPlatformFee() {
    return this.contract._platformFeeBps();
  }
  /**
   * Get registry address
   */
  async getRegistry() {
    return this.contract.registry();
  }
};

export {
  TaskClient
};
