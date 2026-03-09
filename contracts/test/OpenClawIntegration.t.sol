// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {OpenClawRegistry} from "../src/core/OpenClawRegistry.sol";
import {OpenClawTaskMarketplace} from "../src/core/OpenClawTaskMarketplace.sol";
import {OpenClawGovernance} from "../src/core/OpenClawGovernance.sol";
import {OpenClawReputation} from "../src/core/OpenClawReputation.sol";
import {IOpenClawReputation} from "../src/interfaces/IOpenClawReputation.sol";
import {IOpenClawGovernance} from "../src/interfaces/IOpenClawGovernance.sol";

contract MockToken {
    string public name = "HAVEN";
    string public symbol = "HAVEN";
    uint8 public decimals = 18;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

contract OpenClawIntegrationTest is Test {
    OpenClawRegistry public registry;
    OpenClawTaskMarketplace public marketplace;
    OpenClawGovernance public governance;
    OpenClawReputation public reputation;
    MockToken public token;

    address public owner = makeAddr("owner");
    address public agent1 = makeAddr("agent1");
    address public agent2 = makeAddr("agent2");
    address public taskCreator = makeAddr("taskCreator");
    
    uint256 public constant INITIAL_STAKE = 1000 * 1e18;
    uint256 public constant TASK_REWARD = 100 * 1e18;
    uint256 public constant VOTING_DELAY = 100;
    uint256 public constant VOTING_PERIOD = 1000;

    function setUp() public {
        token = new MockToken();
        token.mint(msg.sender, 1000000 * 1e18);
        
        vm.startPrank(owner);
        reputation = new OpenClawReputation(owner, address(token), 100 * 1e18, 1000000 * 1e18);
        registry = new OpenClawRegistry(owner);
        governance = new OpenClawGovernance(owner, VOTING_DELAY, VOTING_PERIOD, 500, 20);
        marketplace = new OpenClawTaskMarketplace(owner);
        
        marketplace.setRegistry(address(registry));
        governance.setReputationContract(address(reputation));
        reputation.setUpdater(address(marketplace), true);
        reputation.setUpdater(address(governance), true);
        vm.stopPrank();
        
        token.transfer(agent1, 50000 * 1e18);
        token.transfer(agent2, 50000 * 1e18);
        token.transfer(taskCreator, 50000 * 1e18);
    }

    function test_FullWorkflow() public {
        // Register Agents
        bytes32[] memory capabilities1 = new bytes32[](2);
        capabilities1[0] = bytes32("trading");
        capabilities1[1] = bytes32("analysis");
        
        bytes32[] memory capabilities2 = new bytes32[](1);
        capabilities2[0] = bytes32("governance");

        vm.prank(agent1);
        registry.registerAgent(agent1, 1, "ipfs://agent1", capabilities1);
        
        vm.prank(agent2);
        registry.registerAgent(agent2, 2, "ipfs://agent2", capabilities2);

        assertTrue(registry.isAgent(agent1));
        assertTrue(registry.isAgent(agent2));

        // Stake Tokens
        vm.prank(agent1);
        token.approve(address(reputation), INITIAL_STAKE);
        vm.prank(agent1);
        reputation.stake(INITIAL_STAKE, 86400);
        
        vm.prank(agent2);
        token.approve(address(reputation), INITIAL_STAKE);
        vm.prank(agent2);
        reputation.stake(INITIAL_STAKE, 86400);

        // Create and Complete Task
        vm.prank(taskCreator);
        token.approve(address(marketplace), TASK_REWARD);
        
        vm.prank(taskCreator);
        uint256 taskId = marketplace.createTask(
            "Analyze market trends",
            bytes32("trading"),
            TASK_REWARD,
            address(token),
            block.timestamp + 10 days
        );

        vm.prank(agent1);
        marketplace.acceptTask(taskId);

        vm.prank(agent1);
        marketplace.completeTask(taskId, "ipfs://result", "");

        // Manually update reputation
        vm.prank(owner);
        reputation.recordTaskCompletion(agent1);

        IOpenClawReputation.AgentRepInfo memory rep1 = reputation.getReputation(agent1);
        assertEq(rep1.tasksCompleted, 1);

        // Create and Vote on Proposal
        bytes32[] memory emptyCaps = new bytes32[](0);
        
        vm.prank(agent1);
        uint256 proposalId = governance.createProposal(
            "Increase task rewards by 10%",
            "ipfs://proposal1",
            emptyCaps
        );

        vm.roll(block.number + VOTING_DELAY + 1);

        vm.prank(agent1);
        governance.castVote(proposalId, 1, "Good for the ecosystem");
        
        vm.prank(agent2);
        governance.castVote(proposalId, 1, "Agree with agent1");

        vm.roll(block.number + VOTING_PERIOD + 1);

        vm.prank(owner);
        governance.executeProposal(proposalId);

        assertEq(
            uint256(governance.getProposalState(proposalId)),
            uint256(IOpenClawGovernance.ProposalState.Executed)
        );
    }
}
