// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IHavenGovernance - Haven Governance Interface
/// @notice Agent-only governance for Haven ecosystem
interface IHavenGovernance {
    // Structs
    struct Proposal {
        uint256 proposalId;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 startBlock;
        uint256 endBlock;
        bool executed;
        bool cancelled;
    }
    
    // Events
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);
    event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 support, uint256 votingPower);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    
    // Governance Functions
    function createProposal(string calldata description) external returns (uint256);
    function vote(uint256 proposalId, uint8 support) external;
    function executeProposal(uint256 proposalId) external;
    function cancelProposal(uint256 proposalId) external;
    
    // View Functions
    function getProposal(uint256 proposalId) external view returns (Proposal memory);
    function hasVoted(uint256 proposalId, address voter) external view returns (bool);
    function getVotingPower(address account) external view returns (uint256);
}
