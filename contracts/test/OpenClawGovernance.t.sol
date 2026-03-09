// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {OpenClawGovernance} from "../src/core/OpenClawGovernance.sol";
import {OpenClawReputation} from "../src/core/OpenClawReputation.sol";
import {IOpenClawGovernance} from "../src/interfaces/IOpenClawGovernance.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock", "MCK") {
        _mint(msg.sender, 1000000 * 1e18);
    }
}

contract OpenClawGovernanceTest is Test {
    OpenClawGovernance public governance;
    OpenClawReputation public reputation;
    ERC20 public token;
    
    address public owner = makeAddr("owner");
    address public proposer = makeAddr("proposer");
    address public voter1 = makeAddr("voter1");
    address public voter2 = makeAddr("voter2");
    
    uint256 public constant VOTING_DELAY = 100;
    uint256 public constant VOTING_PERIOD = 1000;
    uint256 public constant EXECUTION_DELAY = 500;
    uint256 public constant QUORUM = 20;

    function setUp() public {
        vm.startPrank(owner);
        
        token = new MockToken();
        reputation = new OpenClawReputation(owner, address(token), 100 * 1e18, 1000000 * 1e18);
        governance = new OpenClawGovernance(owner, VOTING_DELAY, VOTING_PERIOD, EXECUTION_DELAY, QUORUM);
        governance.setReputationContract(address(reputation));
        
        reputation.initializeReputation(proposer);
        reputation.initializeReputation(voter1);
        reputation.initializeReputation(voter2);
        
        vm.stopPrank();
    }

    function test_CreateProposal() public {
        bytes32[] memory capabilities = new bytes32[](0);
        
        vm.prank(proposer);
        uint256 proposalId = governance.createProposal("Test proposal", "ipfs://QmTest", capabilities);

        IOpenClawGovernance.Proposal memory proposal = governance.getProposal(proposalId);
        assertEq(proposal.proposer, proposer);
        assertEq(proposal.description, "Test proposal");
    }

    function test_CastVote() public {
        bytes32[] memory capabilities = new bytes32[](0);
        
        vm.prank(proposer);
        uint256 proposalId = governance.createProposal("Test proposal", "ipfs://QmTest", capabilities);
        vm.roll(block.number + VOTING_DELAY + 1);

        vm.prank(voter1);
        governance.castVote(proposalId, 1, "I support this");

        IOpenClawGovernance.Vote memory vote = governance.getVote(proposalId, voter1);
        assertEq(vote.support, 1);
        assertTrue(governance.hasVoted(proposalId, voter1));
    }

    function test_GetProposalState() public {
        bytes32[] memory capabilities = new bytes32[](0);
        
        vm.prank(proposer);
        uint256 proposalId = governance.createProposal("Test proposal", "ipfs://QmTest", capabilities);

        assertEq(uint256(governance.getProposalState(proposalId)), uint256(IOpenClawGovernance.ProposalState.Pending));

        vm.roll(block.number + VOTING_DELAY + 1);
        assertEq(uint256(governance.getProposalState(proposalId)), uint256(IOpenClawGovernance.ProposalState.Active));

        vm.roll(block.number + VOTING_PERIOD + 1);
        assertEq(uint256(governance.getProposalState(proposalId)), uint256(IOpenClawGovernance.ProposalState.Defeated));
    }

    function test_VotingPower() public {
        vm.prank(owner);
        token.transfer(voter1, 1000 * 1e18);
        vm.prank(voter1);
        token.approve(address(reputation), 1000 * 1e18);
        vm.prank(voter1);
        reputation.doStake(1000 * 1e18, 86400);

        bytes32[] memory capabilities = new bytes32[](0);
        vm.prank(proposer);
        uint256 proposalId = governance.createProposal("Test proposal", "ipfs://QmTest", capabilities);
        vm.roll(block.number + VOTING_DELAY + 1);

        vm.prank(voter1);
        governance.castVote(proposalId, 1, "Voting with stake");

        IOpenClawGovernance.Vote memory vote = governance.getVote(proposalId, voter1);
        assertGt(vote.votingPower, 0);
    }

    function test_Revert_AlreadyVoted() public {
        bytes32[] memory capabilities = new bytes32[](0);
        vm.prank(proposer);
        uint256 proposalId = governance.createProposal("Test proposal", "ipfs://QmTest", capabilities);
        vm.roll(block.number + VOTING_DELAY + 1);

        vm.prank(voter1);
        governance.castVote(proposalId, 1, "First vote");

        vm.expectRevert("Already voted");
        vm.prank(voter1);
        governance.castVote(proposalId, 0, "Second vote");
    }
}
