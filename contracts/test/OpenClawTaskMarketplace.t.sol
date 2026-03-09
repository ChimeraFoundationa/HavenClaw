// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {OpenClawTaskMarketplace} from "../src/core/OpenClawTaskMarketplace.sol";
import {OpenClawRegistry} from "../src/core/OpenClawRegistry.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock", "MCK") {}
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract OpenClawTaskMarketplaceTest is Test {
    OpenClawTaskMarketplace public marketplace;
    OpenClawRegistry public registry;
    MockToken public token;
    
    address public owner = makeAddr("owner");
    address public creator = makeAddr("creator");
    address public agent = makeAddr("agent");
    
    uint256 public constant REWARD = 100 * 1e18;

    function setUp() public {
        token = new MockToken();
        token.mint(msg.sender, 1000000 * 1e18);
        
        registry = new OpenClawRegistry(owner);
        marketplace = new OpenClawTaskMarketplace(owner);
        
        vm.startPrank(owner);
        marketplace.setRegistry(address(registry));
        
        bytes32[] memory caps = new bytes32[](1);
        caps[0] = bytes32("trading");
        registry.registerAgent(agent, 1, "ipfs://test", caps);
        
        token.transfer(creator, 10000 * 1e18);
        vm.stopPrank();
    }

    function test_CreateTask() public {
        vm.prank(creator);
        token.approve(address(marketplace), REWARD);
        
        uint256 taskId = marketplace.createTask("Test task", bytes32("trading"), REWARD, address(token), block.timestamp + 10 days);
        assertEq(taskId, 1);
    }

    function test_AcceptTask() public {
        vm.prank(creator);
        token.approve(address(marketplace), REWARD);
        vm.prank(creator);
        uint256 taskId = marketplace.createTask("Test task", bytes32("trading"), REWARD, address(token), block.timestamp + 10 days);

        vm.prank(agent);
        marketplace.acceptTask(taskId);
    }

    function test_CompleteTask() public {
        vm.prank(creator);
        token.approve(address(marketplace), REWARD);
        vm.prank(creator);
        uint256 taskId = marketplace.createTask("Test task", bytes32("trading"), REWARD, address(token), block.timestamp + 10 days);

        vm.prank(agent);
        marketplace.acceptTask(taskId);

        vm.prank(agent);
        marketplace.completeTask(taskId, "ipfs://result", "");
    }

    function test_CancelTask() public {
        vm.prank(creator);
        token.approve(address(marketplace), REWARD);
        vm.prank(creator);
        uint256 taskId = marketplace.createTask("Test task", bytes32("trading"), REWARD, address(token), block.timestamp + 10 days);

        uint256 balanceBefore = token.balanceOf(creator);
        vm.prank(creator);
        marketplace.cancelTask(taskId);

        assertEq(token.balanceOf(creator), balanceBefore + REWARD);
    }
}
