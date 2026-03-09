// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {OpenClawReputation} from "../src/core/OpenClawReputation.sol";
import {IOpenClawReputation} from "../src/interfaces/IOpenClawReputation.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock HAVEN", "HAVEN") {
        _mint(msg.sender, 1000000 * 1e18);
    }
}

contract OpenClawReputationTest is Test {
    OpenClawReputation public reputation;
    ERC20 public token;
    
    address public owner = makeAddr("owner");
    address public agent1 = makeAddr("agent1");
    address public agent2 = makeAddr("agent2");
    
    uint256 public constant MIN_STAKE = 100 * 1e18;
    uint256 public constant MAX_STAKE = 10000 * 1e18;

    function setUp() public {
        vm.startPrank(owner);
        
        token = new MockToken();
        reputation = new OpenClawReputation(owner, address(token), MIN_STAKE, MAX_STAKE);
        reputation.setUpdater(owner, true);
        
        vm.stopPrank();
    }

    function test_InitializeReputation() public {
        vm.prank(agent1);
        reputation.initializeReputation(agent1);

        IOpenClawReputation.AgentRepInfo memory rep = reputation.getReputation(agent1);
        assertEq(rep.agent, agent1);
        assertEq(rep.score, reputation.baseReputation());
    }

    function test_Stake() public {
        vm.prank(agent1);
        reputation.initializeReputation(agent1);

        vm.prank(owner);
        token.transfer(agent1, MIN_STAKE);

        vm.prank(agent1);
        token.approve(address(reputation), MIN_STAKE);

        vm.prank(agent1);
        reputation.doStake(MIN_STAKE, 86400);

        IOpenClawReputation.StakeInfo memory stake = reputation.getStake(agent1);
        assertEq(stake.amount, MIN_STAKE);
        assertTrue(stake.active);
    }

    function test_Unstake() public {
        vm.prank(agent1);
        reputation.initializeReputation(agent1);

        vm.prank(owner);
        token.transfer(agent1, MIN_STAKE);

        vm.prank(agent1);
        token.approve(address(reputation), MIN_STAKE);

        vm.prank(agent1);
        reputation.doStake(MIN_STAKE, 1);

        vm.warp(block.timestamp + 2);

        uint256 balanceBefore = token.balanceOf(agent1);
        
        vm.prank(agent1);
        reputation.unstake(MIN_STAKE);

        assertEq(token.balanceOf(agent1) - balanceBefore, MIN_STAKE);
    }

    function test_Revert_UnstakeLocked() public {
        vm.prank(agent1);
        reputation.initializeReputation(agent1);

        vm.prank(owner);
        token.transfer(agent1, MIN_STAKE);

        vm.prank(agent1);
        token.approve(address(reputation), MIN_STAKE);

        vm.prank(agent1);
        reputation.doStake(MIN_STAKE, 86400);

        vm.expectRevert("Still locked");
        vm.prank(agent1);
        reputation.unstake(MIN_STAKE);
    }

    function test_RecordTaskCompletion() public {
        vm.prank(agent1);
        reputation.initializeReputation(agent1);

        uint256 scoreBefore = reputation.getReputation(agent1).score;
        
        vm.prank(owner);
        reputation.recordTaskCompletion(agent1);

        IOpenClawReputation.AgentRepInfo memory rep = reputation.getReputation(agent1);
        assertEq(rep.tasksCompleted, 1);
        assertEq(rep.score, scoreBefore + reputation.taskCompleteReward());
    }

    function test_Slash() public {
        vm.prank(agent1);
        reputation.initializeReputation(agent1);

        vm.prank(owner);
        token.transfer(agent1, MIN_STAKE);

        vm.prank(agent1);
        token.approve(address(reputation), MIN_STAKE);

        vm.prank(agent1);
        reputation.doStake(MIN_STAKE, 86400);

        uint256 slashAmount = (MIN_STAKE * reputation.slashPercentage()) / 10000;
        uint256 ownerBalanceBefore = token.balanceOf(owner);

        vm.prank(owner);
        reputation.slash(agent1, MIN_STAKE, "Misbehavior");

        IOpenClawReputation.StakeInfo memory stake = reputation.getStake(agent1);
        assertEq(stake.amount, MIN_STAKE - slashAmount);
        assertEq(token.balanceOf(owner) - ownerBalanceBefore, slashAmount);
    }

    function test_GetVotingPower() public {
        vm.prank(agent1);
        reputation.initializeReputation(agent1);

        vm.prank(owner);
        token.transfer(agent1, 1000 * 1e18);

        vm.prank(agent1);
        token.approve(address(reputation), 1000 * 1e18);

        vm.prank(agent1);
        reputation.doStake(1000 * 1e18, 86400);

        uint256 votingPower = reputation.getVotingPower(agent1);
        uint256 expected = reputation.baseReputation() + 1000;
        assertEq(votingPower, expected);
    }
}
