// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOpenClawGovernance
 * @dev Interface for OpenClaw Governance
 */
interface IOpenClawGovernance {
    enum ProposalState {
        Pending,
        Active,
        Succeeded,
        Defeated,
        Queued,
        Executed
    }

    struct Proposal {
        uint256 proposalId;
        address proposer;
        string description;
        string metadataURI;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalState state;
        uint256 createdAt;
        bytes32[] capabilityHashes;
    }

    struct Vote {
        uint256 proposalId;
        address voter;
        uint8 support; // 0=Against, 1=For, 2=Abstain
        uint256 votingPower;
        string reason;
        uint256 votedAt;
    }

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 startBlock,
        uint256 endBlock
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 support,
        uint256 votingPower,
        string reason
    );

    event ProposalExecuted(uint256 indexed proposalId, address indexed executor);

    event ProposalQueued(uint256 indexed proposalId, uint256 eta);

    function createProposal(
        string calldata description,
        string calldata metadataURI,
        bytes32[] calldata capabilityHashes
    ) external returns (uint256);

    function castVote(uint256 proposalId, uint8 support, string calldata reason) external;

    function castVoteWithProof(
        uint256 proposalId,
        uint8 support,
        string calldata reason,
        bytes calldata zkProof
    ) external;

    function executeProposal(uint256 proposalId) external;

    function queueProposal(uint256 proposalId) external;

    function getProposal(uint256 proposalId) external view returns (Proposal memory);

    function getProposalState(uint256 proposalId) external view returns (ProposalState);

    function hasVoted(uint256 proposalId, address voter) external view returns (bool);

    function getVote(uint256 proposalId, address voter) external view returns (Vote memory);

    function getActiveProposals() external view returns (uint256[] memory);

    function getVotingPower(address voter, uint256 blockNumber) external view returns (uint256);
}
