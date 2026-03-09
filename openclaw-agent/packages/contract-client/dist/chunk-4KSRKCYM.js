// src/RegistryClient.ts
import { ethers, Contract } from "ethers";

// abi/Registry.json
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

// src/RegistryClient.ts
var RegistryClient = class _RegistryClient {
  contract;
  signer;
  constructor(address, providerOrSigner) {
    try {
      this.signer = providerOrSigner;
      this.contract = new Contract(address, Registry_default, this.signer);
    } catch {
      this.contract = new Contract(address, Registry_default, providerOrSigner);
    }
  }
  /**
   * Connect a signer for write operations
   */
  async connect(signer) {
    return new _RegistryClient(await this.getAddress(), signer);
  }
  /**
   * Get contract address
   */
  async getAddress() {
    return this.contract.getAddress();
  }
  /**
   * Register a new agent
   */
  async registerAgent(params) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    const capabilityHashes = params.capabilities.map((c) => ethers.id(c));
    return this.contract.registerAgent(
      params.tbaAddress,
      params.nftTokenId,
      params.metadataUri,
      capabilityHashes
    );
  }
  /**
   * Register agent with ZK proof
   */
  async registerAgentWithProof(params, proof) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    const capabilityHashes = params.capabilities.map((c) => ethers.id(c));
    return this.contract.registerAgentWithProof(
      params.tbaAddress,
      params.nftTokenId,
      params.metadataUri,
      capabilityHashes,
      proof
    );
  }
  /**
   * Update agent capabilities
   */
  async updateCapabilities(tbaAddress, metadataUri, capabilities) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    const capabilityHashes = capabilities.map((c) => ethers.id(c));
    return this.contract.updateAgent(tbaAddress, metadataUri, capabilityHashes);
  }
  /**
   * Deactivate an agent
   */
  async deactivateAgent(tbaAddress) {
    if (!this.signer) {
      throw new Error("Signer not connected");
    }
    return this.contract.deactivateAgent(tbaAddress);
  }
  /**
   * Get agent information
   */
  async getAgent(tbaAddress) {
    try {
      const agent = await this.contract.getAgent(tbaAddress);
      return {
        tbaAddress: agent.tbaAddress,
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
  /**
   * Check if address is a registered agent
   */
  async isAgent(tbaAddress) {
    return this.contract.isAgent(tbaAddress);
  }
  /**
   * Get total number of registered agents
   */
  async getAgentCount() {
    return this.contract.getAgentCount();
  }
  /**
   * Check if agent has specific capability
   */
  async hasCapability(tbaAddress, capability) {
    return this.contract.hasCapability(tbaAddress, ethers.id(capability));
  }
  /**
   * Get all agents with specific capability
   */
  async getAgentsByCapability(capability) {
    return this.contract.getAgentsByCapability(ethers.id(capability));
  }
  /**
   * Get agent's capability count
   */
  async getCapabilityCount(tbaAddress) {
    return this.contract.getCapabilityCount(tbaAddress);
  }
  /**
   * Get ZK verifier address
   */
  async getZkVerifier() {
    return this.contract.zkVerifier();
  }
  /**
   * Check if ZK verification is enabled
   */
  async isZkEnabled() {
    return this.contract.zkEnabled();
  }
};

export {
  RegistryClient
};
