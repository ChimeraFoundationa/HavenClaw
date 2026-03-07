// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {PLONKVerifier} from "../src/core/PLONKVerifier.sol";

/// @title DeployPLONKVerifier
/// @notice Deploy PLONKVerifier for 6g_capability_proof circuit
///
/// Usage:
///   forge script zk/scripts/DeployPLONKVerifier.s.sol --rpc-url <URL> --broadcast
///
/// Before running:
///   1. Run: bash zk/scripts/setup-plonk.sh
///   2. Copy values from zk/build/verifier_plonk.sol to PLONKVerifier.sol
contract DeployPLONKVerifier is Script {
    function run() external returns (PLONKVerifier verifier) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        // Deploy the verifier
        verifier = new PLONKVerifier();

        vm.stopBroadcast();

        console.log("PLONKVerifier deployed to:", address(verifier));
        console.log("N (constraints):", verifier.N());
        console.log("Public inputs:", verifier.NUM_PUBLIC_INPUTS());
    }
}
