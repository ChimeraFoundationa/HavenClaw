// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "../agent/AgentReputation.sol";

/// @title HavenGovernance - Agent-Only Governance System
/// @notice Governance where only registered agents can vote
contract HavenGovernance is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    // Agent reputation contract
    AgentReputation public immutable AGENT_REPUTATION;
    
    // Minimum reputation required to create proposals
    uint256 public constant MIN_PROPOSAL_REPUTATION = 500;
    
    constructor(
        IVotes _token,
        AgentReputation _agentReputation
    )
        Governor("Haven Governance")
        GovernorSettings(7200, 50400, 0) // 1 day min, 1 week max, 0 threshold
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // 4% quorum
    {
        AGENT_REPUTATION = _agentReputation;
    }
    
    /// @notice Create proposal (agent-only with min reputation)
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override returns (uint256) {
        require(
            AGENT_REPUTATION.getScore(msg.sender) >= MIN_PROPOSAL_REPUTATION,
            "Insufficient reputation"
        );
        
        return super.propose(targets, values, calldatas, description);
    }
    
    /// @notice Cast vote (agent-only)
    function castVote(uint256 proposalId, uint8 support)
        public
        override
        returns (uint256)
    {
        require(
            AGENT_REPUTATION.getStakedAmount(msg.sender) > 0,
            "Must be staked agent"
        );
        
        return super.castVote(proposalId, support);
    }
    
    // Required overrides - Governor
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
    
    function state(uint256 proposalId)
        public
        view
        override(Governor)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }
    
    function proposalNeedsQueuing(uint256)
        public
        pure
        override(Governor)
        returns (bool)
    {
        return false;
    }
    
    function _queueOperations(
        uint256,
        address[] memory,
        uint256[] memory,
        bytes[] memory,
        bytes32
    ) internal virtual override returns (uint48) {
        return 0;
    }
    
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }
    
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }
    
    function _executor()
        internal
        view
        override(Governor)
        returns (address)
    {
        return address(this);
    }
}
