// src/index.ts
import { ethers as ethers2, Wallet, JsonRpcProvider, Contract as Contract2 } from "ethers";

// src/abi/Registry.json
var Registry_default = [
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
    type: "function",
    name: "deactivateAgent",
    inputs: [
      {
        name: "tbaAddress",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getAgent",
    inputs: [
      {
        name: "tbaAddress",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IOpenClawRegistry.Agent",
        components: [
          {
            name: "tbaAddress",
            type: "address",
            internalType: "address"
          },
          {
            name: "nftTokenId",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "metadataUri",
            type: "string",
            internalType: "string"
          },
          {
            name: "capabilities",
            type: "bytes32[]",
            internalType: "bytes32[]"
          },
          {
            name: "registeredAt",
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
    name: "getAgentCount",
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
    name: "getAgentsByCapability",
    inputs: [
      {
        name: "capability",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getCapabilityCount",
    inputs: [
      {
        name: "tbaAddress",
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
    name: "hasCapability",
    inputs: [
      {
        name: "tbaAddress",
        type: "address",
        internalType: "address"
      },
      {
        name: "capability",
        type: "bytes32",
        internalType: "bytes32"
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
    name: "isAgent",
    inputs: [
      {
        name: "tbaAddress",
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
    name: "registerAgent",
    inputs: [
      {
        name: "tbaAddress",
        type: "address",
        internalType: "address"
      },
      {
        name: "nftTokenId",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "metadataUri",
        type: "string",
        internalType: "string"
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
    name: "registerAgentWithProof",
    inputs: [
      {
        name: "tbaAddress",
        type: "address",
        internalType: "address"
      },
      {
        name: "nftTokenId",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "metadataUri",
        type: "string",
        internalType: "string"
      },
      {
        name: "capabilities",
        type: "bytes32[]",
        internalType: "bytes32[]"
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
    name: "renounceOwnership",
    inputs: [],
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
    name: "updateAgent",
    inputs: [
      {
        name: "tbaAddress",
        type: "address",
        internalType: "address"
      },
      {
        name: "metadataUri",
        type: "string",
        internalType: "string"
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
    name: "AgentDeactivated",
    inputs: [
      {
        name: "tbaAddress",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      {
        name: "tbaAddress",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "nftTokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256"
      },
      {
        name: "metadataUri",
        type: "string",
        indexed: false,
        internalType: "string"
      },
      {
        name: "capabilities",
        type: "bytes32[]",
        indexed: false,
        internalType: "bytes32[]"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "AgentUpdated",
    inputs: [
      {
        name: "tbaAddress",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "newMetadataUri",
        type: "string",
        indexed: false,
        internalType: "string"
      },
      {
        name: "newCapabilities",
        type: "bytes32[]",
        indexed: false,
        internalType: "bytes32[]"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "CapabilityVerified",
    inputs: [
      {
        name: "agent",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "capability",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32"
      },
      {
        name: "valid",
        type: "bool",
        indexed: false,
        internalType: "bool"
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
  }
];

// src/abi/TaskMarketplace.json
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

// src/abi/Governance.json
var Governance_default = [
  {
    type: "constructor",
    inputs: [
      {
        name: "initialOwner",
        type: "address",
        internalType: "address"
      },
      {
        name: "_votingDelay",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_votingPeriod",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_executionDelay",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_quorumPercentage",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "castVote",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "support",
        type: "uint8",
        internalType: "uint8"
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
    name: "castVoteWithProof",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "support",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "reason",
        type: "string",
        internalType: "string"
      },
      {
        name: "zkProof",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "createProposal",
    inputs: [
      {
        name: "description",
        type: "string",
        internalType: "string"
      },
      {
        name: "metadataURI",
        type: "string",
        internalType: "string"
      },
      {
        name: "capabilityHashes",
        type: "bytes32[]",
        internalType: "bytes32[]"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "executeProposal",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "executionDelay",
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
    name: "getActiveProposals",
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
    name: "getProposal",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IOpenClawGovernance.Proposal",
        components: [
          {
            name: "proposalId",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "proposer",
            type: "address",
            internalType: "address"
          },
          {
            name: "description",
            type: "string",
            internalType: "string"
          },
          {
            name: "metadataURI",
            type: "string",
            internalType: "string"
          },
          {
            name: "startBlock",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "endBlock",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "forVotes",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "againstVotes",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "abstainVotes",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "state",
            type: "uint8",
            internalType: "enum IOpenClawGovernance.ProposalState"
          },
          {
            name: "createdAt",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "capabilityHashes",
            type: "bytes32[]",
            internalType: "bytes32[]"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getProposalState",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum IOpenClawGovernance.ProposalState"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getVote",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "voter",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IOpenClawGovernance.Vote",
        components: [
          {
            name: "proposalId",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "voter",
            type: "address",
            internalType: "address"
          },
          {
            name: "support",
            type: "uint8",
            internalType: "uint8"
          },
          {
            name: "votingPower",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "reason",
            type: "string",
            internalType: "string"
          },
          {
            name: "votedAt",
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
    name: "getVotingPower",
    inputs: [
      {
        name: "voter",
        type: "address",
        internalType: "address"
      },
      {
        name: "",
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
    stateMutability: "view"
  },
  {
    type: "function",
    name: "hasVoted",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "voter",
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
    name: "queueProposal",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "quorumPercentage",
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
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "reputationContract",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IOpenClawReputation"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "setExecutionDelay",
    inputs: [
      {
        name: "delay",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setQuorumPercentage",
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
    name: "setReputationContract",
    inputs: [
      {
        name: "_reputation",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setVotingDelay",
    inputs: [
      {
        name: "delay",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setVotingPeriod",
    inputs: [
      {
        name: "period",
        type: "uint256",
        internalType: "uint256"
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
    name: "totalVotingPower",
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
    name: "votingDelay",
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
    name: "votingPeriod",
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
    name: "ExecutionDelayUpdated",
    inputs: [
      {
        name: "newDelay",
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
    name: "ProposalCreated",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256"
      },
      {
        name: "proposer",
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
        name: "startBlock",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "endBlock",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ProposalExecuted",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256"
      },
      {
        name: "executor",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ProposalQueued",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256"
      },
      {
        name: "eta",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "QuorumUpdated",
    inputs: [
      {
        name: "newQuorum",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "VoteCast",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256"
      },
      {
        name: "voter",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "support",
        type: "uint8",
        indexed: false,
        internalType: "uint8"
      },
      {
        name: "votingPower",
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
    name: "VotingDelayUpdated",
    inputs: [
      {
        name: "newDelay",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "VotingPeriodUpdated",
    inputs: [
      {
        name: "newPeriod",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
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
  }
];

// src/abi/Reputation.json
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

// src/HPPClient.ts
import { ethers, Contract } from "ethers";
var HPP_ABI = [
  // Agent functions
  "function registerAgent(string calldata metadataURI) external",
  "function getAgent(address agent) external view returns (tuple(address wallet, bool registered, uint256 totalEarned, uint256 completedTasks, string metadataURI) memory)",
  // Payment functions
  "function createPayment(address agent, bytes32 conditionHash, uint256 deadline, string calldata metadataURI) external payable returns (uint256)",
  "function createPaymentERC20(address agent, address token, uint256 amount, bytes32 conditionHash, uint256 deadline) external returns (uint256)",
  "function releasePayment(uint256 paymentId, bytes calldata proof) external",
  "function refundPayment(uint256 paymentId) external",
  "function disputePayment(uint256 paymentId, string calldata reason) external",
  // View functions
  "function getPayment(uint256 paymentId) external view returns (tuple(uint256 id, address payer, address agent, uint256 amount, address token, bytes32 conditionHash, uint256 deadline, bool released, bool disputed, uint256 createdAt) memory)",
  "function getAgentPayments(address agent) external view returns (uint256[] memory)",
  // Events
  "event AgentRegistered(address indexed agent, address indexed wallet, string metadataURI)",
  "event PaymentCreated(uint256 indexed paymentId, address indexed payer, address indexed agent, uint256 amount)",
  "event PaymentReleased(uint256 indexed paymentId, address indexed agent, uint256 amount)",
  "event PaymentDisputed(uint256 indexed paymentId, address indexed disputer, string reason)",
  "event PaymentRefunded(uint256 indexed paymentId, address indexed payer, uint256 amount)"
];
var HPPClient = class _HPPClient {
  contract;
  signer;
  constructor(config) {
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
  static create(config) {
    return new _HPPClient(config);
  }
  // ==================== AGENT FUNCTIONS ====================
  /**
   * Register as an agent
   */
  async registerAgent(metadataURI) {
    const tx = await this.contract.registerAgent(metadataURI);
    return tx.wait();
  }
  /**
   * Get agent information
   */
  async getAgent(address) {
    return this.contract.getAgent(address);
  }
  /**
   * Check if address is registered agent
   */
  async isAgent(address) {
    const agent = await this.getAgent(address);
    return agent.registered;
  }
  // ==================== PAYMENT FUNCTIONS ====================
  /**
   * Create a payment (native token)
   */
  async createPayment(agent, conditionHash, deadline, metadataURI, amount) {
    const tx = await this.contract.createPayment(
      agent,
      typeof conditionHash === "string" ? conditionHash : conditionHash,
      deadline,
      metadataURI,
      { value: amount }
    );
    const receipt = await tx.wait();
    const event = receipt?.logs?.find((log) => {
      try {
        return this.contract.interface.parseLog(log)?.name === "PaymentCreated";
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
  async createPaymentERC20(agent, token, amount, conditionHash, deadline, metadataURI) {
    const tx = await this.contract.createPaymentERC20(
      agent,
      token,
      amount,
      conditionHash,
      deadline
    );
    const receipt = await tx.wait();
    const event = receipt?.logs?.find((log) => {
      try {
        return this.contract.interface.parseLog(log)?.name === "PaymentCreated";
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
  async releasePayment(paymentId, proof) {
    const tx = await this.contract.releasePayment(paymentId, proof);
    return tx.wait();
  }
  /**
   * Refund payment (after deadline)
   */
  async refundPayment(paymentId) {
    const tx = await this.contract.refundPayment(paymentId);
    return tx.wait();
  }
  /**
   * Dispute payment
   */
  async disputePayment(paymentId, reason) {
    const tx = await this.contract.disputePayment(paymentId, reason);
    return tx.wait();
  }
  // ==================== VIEW FUNCTIONS ====================
  /**
   * Get payment information
   */
  async getPayment(paymentId) {
    return this.contract.getPayment(paymentId);
  }
  /**
   * Get all payments for an agent
   */
  async getAgentPayments(agent) {
    return this.contract.getAgentPayments(agent);
  }
  /**
   * Check if payment condition is met
   */
  async isConditionMet(paymentId) {
    const payment = await this.getPayment(paymentId);
    return payment.released;
  }
};

// src/index.ts
var TaskStatus = /* @__PURE__ */ ((TaskStatus2) => {
  TaskStatus2[TaskStatus2["Open"] = 0] = "Open";
  TaskStatus2[TaskStatus2["Accepted"] = 1] = "Accepted";
  TaskStatus2[TaskStatus2["InProgress"] = 2] = "InProgress";
  TaskStatus2[TaskStatus2["Completed"] = 3] = "Completed";
  TaskStatus2[TaskStatus2["Disputed"] = 4] = "Disputed";
  TaskStatus2[TaskStatus2["Cancelled"] = 5] = "Cancelled";
  return TaskStatus2;
})(TaskStatus || {});
var ProposalState = /* @__PURE__ */ ((ProposalState2) => {
  ProposalState2[ProposalState2["Pending"] = 0] = "Pending";
  ProposalState2[ProposalState2["Active"] = 1] = "Active";
  ProposalState2[ProposalState2["Succeeded"] = 2] = "Succeeded";
  ProposalState2[ProposalState2["Defeated"] = 3] = "Defeated";
  ProposalState2[ProposalState2["Queued"] = 4] = "Queued";
  ProposalState2[ProposalState2["Executed"] = 5] = "Executed";
  return ProposalState2;
})(ProposalState || {});
var VoteSupport = /* @__PURE__ */ ((VoteSupport2) => {
  VoteSupport2[VoteSupport2["Against"] = 0] = "Against";
  VoteSupport2[VoteSupport2["For"] = 1] = "For";
  VoteSupport2[VoteSupport2["Abstain"] = 2] = "Abstain";
  return VoteSupport2;
})(VoteSupport || {});
var RegistryClient = class _RegistryClient {
  contract;
  signer;
  constructor(address, providerOrSigner) {
    try {
      this.signer = providerOrSigner;
      this.contract = new Contract2(address, Registry_default, this.signer);
    } catch {
      this.contract = new Contract2(address, Registry_default, providerOrSigner);
    }
  }
  async connect(signer) {
    return new _RegistryClient(await this.getAddress(), signer);
  }
  async getAddress() {
    return this.contract.getAddress();
  }
  async registerAgent(params) {
    if (!this.signer) throw new Error("Signer not connected");
    const capabilityHashes = params.capabilities.map((c) => ethers2.id(c));
    return this.contract.registerAgent(params.agentAddress, params.nftTokenId, params.metadataUri, capabilityHashes);
  }
  async isAgent(agentAddress) {
    return this.contract.isAgent(agentAddress);
  }
  async getAgent(agentAddress) {
    try {
      const agent = await this.contract.getAgent(agentAddress);
      return {
        agentAddress: agent.agentAddress,
        nftTokenId: agent.nftTokenId,
        metadataUri: agent.metadataUri,
        capabilities: agent.capabilities,
        registeredAt: agent.registeredAt,
        active: agent.active
      };
    } catch {
      return null;
    }
  }
  async hasCapability(agentAddress, capability) {
    return this.contract.hasCapability(agentAddress, ethers2.id(capability));
  }
};
var TaskClient = class _TaskClient {
  contract;
  signer;
  constructor(address, providerOrSigner) {
    try {
      this.signer = providerOrSigner;
      this.contract = new Contract2(address, TaskMarketplace_default, this.signer);
    } catch {
      this.contract = new Contract2(address, TaskMarketplace_default, providerOrSigner);
    }
  }
  async connect(signer) {
    return new _TaskClient(await this.getAddress(), signer);
  }
  async getAddress() {
    return this.contract.getAddress();
  }
  async createTask(params) {
    if (!this.signer) throw new Error("Signer not connected");
    const capabilityHash = ethers2.id(params.requiredCapability);
    if (params.rewardToken === ethers2.ZeroAddress) {
      return this.contract.createTask(params.description, capabilityHash, params.reward, params.rewardToken, params.deadline, { value: params.reward });
    }
    return this.contract.createTask(params.description, capabilityHash, params.reward, params.rewardToken, params.deadline);
  }
  async acceptTask(taskId) {
    if (!this.signer) throw new Error("Signer not connected");
    return this.contract.acceptTask(taskId);
  }
  async completeTask(taskId, resultUri, proof) {
    if (!this.signer) throw new Error("Signer not connected");
    return this.contract.completeTask(taskId, resultUri, proof || "0x");
  }
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
  async getOpenTasks() {
    return this.contract.getOpenTasks();
  }
};
var GovernanceClient = class _GovernanceClient {
  contract;
  signer;
  constructor(address, providerOrSigner) {
    try {
      this.signer = providerOrSigner;
      this.contract = new Contract2(address, Governance_default, this.signer);
    } catch {
      this.contract = new Contract2(address, Governance_default, providerOrSigner);
    }
  }
  async connect(signer) {
    return new _GovernanceClient(await this.getAddress(), signer);
  }
  async getAddress() {
    return this.contract.getAddress();
  }
  async createProposal(description, metadataUri) {
    if (!this.signer) throw new Error("Signer not connected");
    return this.contract.createProposal(description, metadataUri, []);
  }
  async castVote(proposalId, support, reason = "") {
    if (!this.signer) throw new Error("Signer not connected");
    return this.contract.castVote(proposalId, support, reason);
  }
  async getProposal(proposalId) {
    try {
      const proposal = await this.contract.getProposal(proposalId);
      return {
        proposalId: proposal.proposalId,
        proposer: proposal.proposer,
        description: proposal.description,
        metadataUri: proposal.metadataURI,
        startBlock: proposal.startBlock,
        endBlock: proposal.endBlock,
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        abstainVotes: proposal.abstainVotes,
        state: proposal.state,
        createdAt: proposal.createdAt,
        capabilityHashes: proposal.capabilityHashes
      };
    } catch {
      return null;
    }
  }
  async getProposalState(proposalId) {
    return this.contract.getProposalState(proposalId);
  }
  async getActiveProposals() {
    return this.contract.getActiveProposals();
  }
  async getVotingPower(voter) {
    return this.contract.getVotingPower(voter, 0);
  }
};
var ReputationClient = class _ReputationClient {
  contract;
  signer;
  constructor(address, providerOrSigner) {
    try {
      this.signer = providerOrSigner;
      this.contract = new Contract2(address, Reputation_default, this.signer);
    } catch {
      this.contract = new Contract2(address, Reputation_default, providerOrSigner);
    }
  }
  async connect(signer) {
    return new _ReputationClient(await this.getAddress(), signer);
  }
  async getAddress() {
    return this.contract.getAddress();
  }
  async initializeReputation(agent) {
    if (!this.signer) throw new Error("Signer not connected");
    return this.contract.initializeReputation(agent);
  }
  async getReputation(agent) {
    try {
      const rep = await this.contract.getReputation(agent);
      return {
        agent: rep.agent,
        score: rep.score,
        tasksCompleted: rep.tasksCompleted,
        tasksFailed: rep.tasksFailed,
        stakedAmount: rep.stakedAmount,
        unlockTime: rep.unlockTime
      };
    } catch {
      return null;
    }
  }
  async stake(amount, lockPeriod) {
    if (!this.signer) throw new Error("Signer not connected");
    return this.contract.stake(amount, lockPeriod);
  }
  async getVotingPower(agent) {
    return this.contract.getVotingPower(agent);
  }
};
var OpenClawContractClient = class _OpenClawContractClient {
  registry;
  task;
  governance;
  reputation;
  constructor(registry, task, governance, reputation) {
    this.registry = registry;
    this.task = task;
    this.governance = governance;
    this.reputation = reputation;
  }
  static createReadOnly(config) {
    const provider = new JsonRpcProvider(config.rpcUrl);
    return new _OpenClawContractClient(
      new RegistryClient(config.contracts.registry, provider),
      new TaskClient(config.contracts.taskMarketplace, provider),
      new GovernanceClient(config.contracts.governance, provider),
      new ReputationClient(config.contracts.reputation, provider)
    );
  }
  static create(config) {
    if (!config.privateKey) throw new Error("Private key required");
    const provider = new JsonRpcProvider(config.rpcUrl);
    const signer = new Wallet(config.privateKey, provider);
    return new _OpenClawContractClient(
      new RegistryClient(config.contracts.registry, signer),
      new TaskClient(config.contracts.taskMarketplace, signer),
      new GovernanceClient(config.contracts.governance, signer),
      new ReputationClient(config.contracts.reputation, signer)
    );
  }
  getContractAddresses() {
    return {
      registry: this.registry.contract.target,
      taskMarketplace: this.task.contract.target,
      governance: this.governance.contract.target,
      reputation: this.reputation.contract.target
    };
  }
};
export {
  GovernanceClient,
  HPPClient,
  OpenClawContractClient,
  ProposalState,
  RegistryClient,
  ReputationClient,
  TaskClient,
  TaskStatus,
  VoteSupport
};
