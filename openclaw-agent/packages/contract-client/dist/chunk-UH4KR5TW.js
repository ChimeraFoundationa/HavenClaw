// src/ReputationClient.ts
import { Contract } from "ethers";

// abi/Reputation.json
var Reputation_default = [
  {
    type: "constructor",
    inputs: [
      {
        name: "initialOwner",
        type: "address",
        internalType: "address"
      },
      {
        name: "_stakingToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "_minStake",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_maxStake",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "authorizedUpdaters",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
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
    name: "baseReputation",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "correctVoteReward",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "doStake",
    inputs: [
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "lockPeriod",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getReputation",
    inputs: [
      {
        name: "agent",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IOpenClawReputation.AgentRepInfo",
        components: [
          {
            name: "agent",
            type: "address",
            internalType: "address"
          },
          {
            name: "score",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "tasksCompleted",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "tasksFailed",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "proposalsVoted",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "correctVotes",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "stakedAmount",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "unlockTime",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "lastUpdated",
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
    name: "getStake",
    inputs: [
      {
        name: "staker",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IOpenClawReputation.StakeInfo",
        components: [
          {
            name: "staker",
            type: "address",
            internalType: "address"
          },
          {
            name: "amount",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "lockPeriod",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "stakedAt",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "unlockTime",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "active",
            type: "bool",
            internalType: "bool"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getTotalVotingPower",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getVotingPower",
    inputs: [
      {
        name: "agent",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "initializeReputation",
    inputs: [
      {
        name: "agent",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "isUnlocked",
    inputs: [
      {
        name: "staker",
        type: "address",
        internalType: "address"
      }
    ],
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
    name: "maxStake",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "minStake",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
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
    name: "recordCorrectVote",
    inputs: [
      {
        name: "agent",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "recordTaskCompletion",
    inputs: [
      {
        name: "agent",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "recordTaskFailure",
    inputs: [
      {
        name: "agent",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
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
    name: "setMaxStake",
    inputs: [
      {
        name: "_max",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setMinStake",
    inputs: [
      {
        name: "_min",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setReputationParams",
    inputs: [
      {
        name: "_baseReputation",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_taskCompleteReward",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_taskFailurePenalty",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_correctVoteReward",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setSlashPercentage",
    inputs: [
      {
        name: "percentage",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setStakingToken",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setUpdater",
    inputs: [
      {
        name: "updater",
        type: "address",
        internalType: "address"
      },
      {
        name: "authorized",
        type: "bool",
        internalType: "bool"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "slash",
    inputs: [
      {
        name: "agent",
        type: "address",
        internalType: "address"
      },
      {
        name: "amount",
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
    name: "slashPercentage",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "stake",
    inputs: [
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "lockPeriod",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "stakingToken",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IERC20"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "taskCompleteReward",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "taskFailurePenalty",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "totalStaked",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
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
    name: "unstake",
    inputs: [
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "updateReputation",
    inputs: [
      {
        name: "agent",
        type: "address",
        internalType: "address"
      },
      {
        name: "scoreChange",
        type: "int256",
        internalType: "int256"
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
    type: "event",
    name: "MaxStakeUpdated",
    inputs: [
      {
        name: "newMax",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "MinStakeUpdated",
    inputs: [
      {
        name: "newMin",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
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
    name: "ReputationParamsUpdated",
    inputs: [
      {
        name: "base",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "taskReward",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "taskPenalty",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ReputationUpdated",
    inputs: [
      {
        name: "agent",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "scoreChange",
        type: "int256",
        indexed: false,
        internalType: "int256"
      },
      {
        name: "newScore",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
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
    name: "SlashExecuted",
    inputs: [
      {
        name: "agent",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
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
    name: "StakingTokenSet",
    inputs: [
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TokensStaked",
    inputs: [
      {
        name: "staker",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "lockPeriod",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "unlockTime",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TokensUnstaked",
    inputs: [
      {
        name: "staker",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "newStake",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "UpdaterAuthorized",
    inputs: [
      {
        name: "updater",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "authorized",
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

// src/ReputationClient.ts
var ReputationClient = class _ReputationClient {
  contract;
  signer;
  constructor(address, providerOrSigner) {
    try {
      this.signer = providerOrSigner;
      this.contract = new Contract(address, Reputation_default, this.signer);
    } catch {
      this.contract = new Contract(address, Reputation_default, providerOrSigner);
    }
  }
  async connect(signer) {
    return new _ReputationClient(await this.getAddress(), signer);
  }
  async getAddress() {
    return this.contract.getAddress();
  }
  /**
   * Initialize reputation for a new agent
   */
  async initializeReputation(agent) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    return this.contract.initializeReputation(agent);
  }
  /**
   * Get reputation info
   */
  async getReputation(agent) {
    try {
      const rep = await this.contract.getReputation(agent);
      return {
        agent: rep.agent,
        score: rep.score,
        tasksCompleted: rep.tasksCompleted,
        tasksFailed: rep.tasksFailed,
        proposalsVoted: rep.proposalsVoted,
        correctVotes: rep.correctVotes,
        stakedAmount: rep.stakedAmount,
        unlockTime: rep.unlockTime,
        lastUpdated: rep.lastUpdated
      };
    } catch {
      return null;
    }
  }
  /**
   * Stake tokens
   */
  async stake(params) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    return this.contract.stake(params.amount, params.lockPeriod);
  }
  /**
   * Unstake tokens
   */
  async unstake(amount) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    return this.contract.unstake(amount);
  }
  /**
   * Get stake info
   */
  async getStake(staker) {
    try {
      const stake = await this.contract.getStake(staker);
      return {
        staker: stake.staker,
        amount: stake.amount,
        lockPeriod: stake.lockPeriod,
        stakedAt: stake.stakedAt,
        unlockTime: stake.unlockTime,
        active: stake.active
      };
    } catch {
      return null;
    }
  }
  /**
   * Get voting power
   */
  async getVotingPower(agent) {
    return this.contract.getVotingPower(agent);
  }
  /**
   * Check if stake is unlocked
   */
  async isUnlocked(staker) {
    return this.contract.isUnlocked(staker);
  }
  /**
   * Get staking token address
   */
  async getStakingToken() {
    return this.contract.stakingToken();
  }
  /**
   * Get minimum stake
   */
  async getMinStake() {
    return this.contract.minStake();
  }
  /**
   * Get maximum stake
   */
  async getMaxStake() {
    return this.contract.maxStake();
  }
  /**
   * Get total staked
   */
  async getTotalStaked() {
    return this.contract.totalStaked();
  }
  /**
   * Get base reputation
   */
  async getBaseReputation() {
    return this.contract.baseReputation();
  }
  /**
   * Get task complete reward
   */
  async getTaskCompleteReward() {
    return this.contract.taskCompleteReward();
  }
  /**
   * Get task failure penalty
   */
  async getTaskFailurePenalty() {
    return this.contract.taskFailurePenalty();
  }
  /**
   * Get correct vote reward
   */
  async getCorrectVoteReward() {
    return this.contract.correctVoteReward();
  }
  /**
   * Get slash percentage (in basis points)
   */
  async getSlashPercentage() {
    return this.contract.slashPercentage();
  }
};

export {
  ReputationClient
};
