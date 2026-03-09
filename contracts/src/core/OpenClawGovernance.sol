// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IOpenClawGovernance} from "../interfaces/IOpenClawGovernance.sol";
import {IOpenClawReputation} from "../interfaces/IOpenClawReputation.sol";
import {IZKVerifier} from "../interfaces/IZKVerifier.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract OpenClawGovernance is IOpenClawGovernance, Ownable {
    mapping(uint256 => Proposal) private _proposals;
    mapping(uint256 => mapping(address => Vote)) private _votes;
    mapping(uint256 => mapping(address => bool)) private _hasVoted;
    mapping(address => uint256[]) private _votedProposals;

    uint256 private _proposalCounter;
    uint256 public votingDelay;
    uint256 public votingPeriod;
    uint256 public executionDelay;
    uint256 public quorumPercentage;
    uint256 public totalVotingPower;

    IOpenClawReputation public reputationContract;
    IZKVerifier public zkVerifier;
    bool public zkEnabled;

    event VotingDelayUpdated(uint256 newDelay);
    event VotingPeriodUpdated(uint256 newPeriod);
    event ExecutionDelayUpdated(uint256 newDelay);
    event QuorumUpdated(uint256 newQuorum);
    event ZKVerifierSet(address indexed verifier, bool enabled);

    constructor(
        address initialOwner,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _executionDelay,
        uint256 _quorumPercentage
    ) Ownable(initialOwner) {
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        executionDelay = _executionDelay;
        quorumPercentage = _quorumPercentage;
    }

    function setReputationContract(address _reputation) external onlyOwner {
        reputationContract = IOpenClawReputation(_reputation);
    }

    function setZKVerifier(address verifier, bool enabled) external onlyOwner {
        zkVerifier = IZKVerifier(verifier);
        zkEnabled = enabled;
        emit ZKVerifierSet(verifier, enabled);
    }

    function setVotingDelay(uint256 delay) external onlyOwner {
        votingDelay = delay;
        emit VotingDelayUpdated(delay);
    }

    function setVotingPeriod(uint256 period) external onlyOwner {
        votingPeriod = period;
        emit VotingPeriodUpdated(period);
    }

    function setExecutionDelay(uint256 delay) external onlyOwner {
        executionDelay = delay;
        emit ExecutionDelayUpdated(delay);
    }

    function setQuorumPercentage(uint256 percentage) external onlyOwner {
        require(percentage <= 100, "Invalid percentage");
        quorumPercentage = percentage;
        emit QuorumUpdated(percentage);
    }

    function createProposal(
        string calldata description,
        string calldata metadataURI,
        bytes32[] calldata capabilityHashes
    ) external override returns (uint256) {
        _proposalCounter++;
        uint256 proposalId = _proposalCounter;

        uint256 startBlock = block.number + votingDelay;
        uint256 endBlock = startBlock + votingPeriod;

        _proposals[proposalId] = Proposal({
            proposalId: proposalId,
            proposer: msg.sender,
            description: description,
            metadataURI: metadataURI,
            startBlock: startBlock,
            endBlock: endBlock,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            state: ProposalState.Pending,
            createdAt: block.timestamp,
            capabilityHashes: capabilityHashes
        });

        emit ProposalCreated(proposalId, msg.sender, description, startBlock, endBlock);
        return proposalId;
    }

    function castVote(uint256 proposalId, uint8 support, string calldata reason) external override {
        _castVote(proposalId, msg.sender, support, reason, "");
    }

    function castVoteWithProof(
        uint256 proposalId,
        uint8 support,
        string calldata reason,
        bytes calldata zkProof
    ) external override {
        require(zkEnabled, "ZK voting not enabled");
        _castVote(proposalId, msg.sender, support, reason, zkProof);
    }

    function executeProposal(uint256 proposalId) external override {
        Proposal storage proposal = _proposals[proposalId];
        require(getProposalState(proposalId) == ProposalState.Succeeded, "Proposal not succeeded");
        proposal.state = ProposalState.Executed;
        emit ProposalExecuted(proposalId, msg.sender);
    }

    function queueProposal(uint256 proposalId) external override {
        Proposal storage proposal = _proposals[proposalId];
        require(getProposalState(proposalId) == ProposalState.Succeeded, "Proposal not succeeded");
        proposal.state = ProposalState.Queued;
        emit ProposalQueued(proposalId, block.timestamp + executionDelay);
    }

    function getProposal(uint256 proposalId) external view override returns (Proposal memory) {
        return _proposals[proposalId];
    }

    function getProposalState(uint256 proposalId) public view override returns (ProposalState) {
        Proposal storage proposal = _proposals[proposalId];

        if (proposal.state == ProposalState.Executed) {
            return ProposalState.Executed;
        }
        if (block.number < proposal.startBlock) {
            return ProposalState.Pending;
        }
        if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        }

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 quorum = (totalVotingPower * quorumPercentage) / 100;

        if (totalVotes < quorum) {
            return ProposalState.Defeated;
        }
        if (proposal.forVotes <= proposal.againstVotes) {
            return ProposalState.Defeated;
        }
        return ProposalState.Succeeded;
    }

    function hasVoted(uint256 proposalId, address voter) external view override returns (bool) {
        return _hasVoted[proposalId][voter];
    }

    function getVote(uint256 proposalId, address voter) external view override returns (Vote memory) {
        return _votes[proposalId][voter];
    }

    function getActiveProposals() external view override returns (uint256[] memory) {
        uint256[] memory allProposals = new uint256[](_proposalCounter);
        uint256 count = 0;

        for (uint256 i = 1; i <= _proposalCounter; i++) {
            if (getProposalState(i) == ProposalState.Active) {
                allProposals[count] = i;
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = allProposals[i];
        }
        return result;
    }

    function getVotingPower(address voter, uint256) external view override returns (uint256) {
        if (address(reputationContract) == address(0)) {
            return 1;
        }
        return reputationContract.getVotingPower(voter);
    }

    function _castVote(
        uint256 proposalId,
        address voter,
        uint8 support,
        string memory reason,
        bytes memory zkProof
    ) internal {
        Proposal storage proposal = _proposals[proposalId];
        require(getProposalState(proposalId) == ProposalState.Active, "Voting not active");
        require(!_hasVoted[proposalId][voter], "Already voted");
        require(support <= 2, "Invalid vote");

        if (zkProof.length > 0) {
            require(address(zkVerifier) != address(0), "ZK verifier not set");
            bytes32[] memory publicInputs = new bytes32[](1);
            publicInputs[0] = bytes32(uint256(uint160(voter)));
            require(zkVerifier.verify(zkProof, publicInputs), "Invalid ZK proof");
        }

        uint256 votingPower = this.getVotingPower(voter, block.number);

        _votes[proposalId][voter] = Vote({
            proposalId: proposalId,
            voter: voter,
            support: support,
            votingPower: votingPower,
            reason: reason,
            votedAt: block.timestamp
        });

        _hasVoted[proposalId][voter] = true;
        _votedProposals[voter].push(proposalId);

        if (support == 0) {
            proposal.againstVotes += votingPower;
        } else if (support == 1) {
            proposal.forVotes += votingPower;
        } else {
            proposal.abstainVotes += votingPower;
        }

        emit VoteCast(proposalId, voter, support, votingPower, reason);
    }

    // View functions
    function proposalCount() external view returns (uint256) {
        return _proposalCounter;
    }

    function getVotedProposals(address voter) external view returns (uint256[] memory) {
        return _votedProposals[voter];
    }
}
