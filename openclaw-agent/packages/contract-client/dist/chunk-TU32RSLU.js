// src/GovernanceClient.ts
import { ethers, Contract } from "ethers";

// abi/Governance.json
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

// src/GovernanceClient.ts
var GovernanceClient = class _GovernanceClient {
  contract;
  signer;
  constructor(address, providerOrSigner) {
    try {
      this.signer = providerOrSigner;
      this.contract = new Contract(address, Governance_default, this.signer);
    } catch {
      this.contract = new Contract(address, Governance_default, providerOrSigner);
    }
  }
  async connect(signer) {
    return new _GovernanceClient(await this.getAddress(), signer);
  }
  async getAddress() {
    return this.contract.getAddress();
  }
  /**
   * Create a new proposal
   */
  async createProposal(params) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    const capabilityHashes = params.capabilityHashes.map((c) => ethers.id(c));
    return this.contract.createProposal(
      params.description,
      params.metadataUri,
      capabilityHashes
    );
  }
  /**
   * Cast a vote
   */
  async castVote(params) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    return this.contract.castVote(params.proposalId, params.support, params.reason || "");
  }
  /**
   * Cast a vote with ZK proof
   */
  async castVoteWithProof(params, zkProof) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    return this.contract.castVoteWithProof(
      params.proposalId,
      params.support,
      params.reason || "",
      zkProof
    );
  }
  /**
   * Execute a successful proposal
   */
  async executeProposal(proposalId) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    return this.contract.executeProposal(proposalId);
  }
  /**
   * Queue a proposal for execution
   */
  async queueProposal(proposalId) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    return this.contract.queueProposal(proposalId);
  }
  /**
   * Get proposal information
   */
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
  /**
   * Get proposal state
   */
  async getProposalState(proposalId) {
    return this.contract.getProposalState(proposalId);
  }
  /**
   * Check if address has voted
   */
  async hasVoted(proposalId, voter) {
    return this.contract.hasVoted(proposalId, voter);
  }
  /**
   * Get vote information
   */
  async getVote(proposalId, voter) {
    try {
      const vote = await this.contract.getVote(proposalId, voter);
      return {
        proposalId: vote.proposalId,
        voter: vote.voter,
        support: vote.support,
        votingPower: vote.votingPower,
        reason: vote.reason,
        votedAt: vote.votedAt
      };
    } catch {
      return null;
    }
  }
  /**
   * Get active proposals
   */
  async getActiveProposals() {
    return this.contract.getActiveProposals();
  }
  /**
   * Get voting power for an address
   */
  async getVotingPower(voter, blockNumber) {
    return this.contract.getVotingPower(voter, blockNumber || 0);
  }
  /**
   * Get voting delay (in blocks)
   */
  async getVotingDelay() {
    return this.contract.votingDelay();
  }
  /**
   * Get voting period (in blocks)
   */
  async getVotingPeriod() {
    return this.contract.votingPeriod();
  }
  /**
   * Get execution delay (in blocks)
   */
  async getExecutionDelay() {
    return this.contract.executionDelay();
  }
  /**
   * Get quorum percentage
   */
  async getQuorumPercentage() {
    return this.contract.quorumPercentage();
  }
  /**
   * Get reputation contract address
   */
  async getReputationContract() {
    return this.contract.reputationContract();
  }
};

export {
  GovernanceClient
};
