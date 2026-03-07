// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {Groth16Verifier} from "../src/core/Groth16Verifier.sol";

/// @title DeployZKVerifier
/// @notice Deploy Groth16Verifier with IC points from 6g_capability_proof circuit
///
/// Usage:
///   forge script zk/scripts/DeployZKVerifier.s.sol --rpc-url <URL> --broadcast
///
/// Before running:
///   1. Run: /root/soft/contracts/zk/scripts/export-verifier.sh
///   2. Copy IC points from zk/build/ic_points.json to IC_X and IC_Y arrays below
contract DeployZKVerifier is Script {
    function run() external returns (Groth16Verifier verifier) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        // ====================================================================
        // IC Points from zk/build/ic_points.json
        // Replace these values after running export-verifier.sh
        // ====================================================================
        uint256[] memory IC_X = new uint256[](7);  // numPublicInputs + 1
        uint256[] memory IC_Y = new uint256[](7);

        // IC[0] - constant term
        IC_X[0] = 0;  // Replace with actual value from ic_points.json
        IC_Y[0] = 0;  // Replace with actual value from ic_points.json

        // IC[1..6] - public inputs (agentId, capabilityHash, avgAccuracy, timestamp, reserved1, reserved2)
        IC_X[1] = 0;  // Replace with actual value
        IC_Y[1] = 0;

        IC_X[2] = 0;  // Replace with actual value
        IC_Y[2] = 0;

        IC_X[3] = 0;  // Replace with actual value
        IC_Y[3] = 0;

        IC_X[4] = 0;  // Replace with actual value
        IC_Y[4] = 0;

        IC_X[5] = 0;  // Replace with actual value
        IC_Y[5] = 0;

        IC_X[6] = 0;  // Replace with actual value
        IC_Y[6] = 0;

        // ====================================================================
        // Verification Key Parameters
        // Replace these values from the zkey export
        // ====================================================================
        uint256 ALPHA_X = 0;  // Replace with actual value
        uint256 ALPHA_Y = 0;  // Replace with actual value

        uint256 BETA_X_1 = 0;   // Replace with actual value
        uint256 BETA_X_2 = 0;   // Replace with actual value
        uint256 BETA_Y_1 = 0;   // Replace with actual value
        uint256 BETA_Y_2 = 0;   // Replace with actual value

        uint256 GAMMA_X_1 = 0;  // Replace with actual value
        uint256 GAMMA_X_2 = 0;  // Replace with actual value
        uint256 GAMMA_Y_1 = 0;  // Replace with actual value
        uint256 GAMMA_Y_2 = 0;  // Replace with actual value

        uint256 DELTA_X_1 = 0;  // Replace with actual value
        uint256 DELTA_X_2 = 0;  // Replace with actual value
        uint256 DELTA_Y_1 = 0;  // Replace with actual value
        uint256 DELTA_Y_2 = 0;  // Replace with actual value

        // Deploy the verifier
        verifier = new Groth16Verifier(
            ALPHA_X,
            ALPHA_Y,
            BETA_X_1, BETA_X_2, BETA_Y_1, BETA_Y_2,
            GAMMA_X_1, GAMMA_X_2, GAMMA_Y_1, GAMMA_Y_2,
            DELTA_X_1, DELTA_X_2, DELTA_Y_1, DELTA_Y_2,
            IC_X,
            IC_Y,
            6  // numPublicInputs
        );

        vm.stopBroadcast();

        console.log("Groth16Verifier deployed to:", address(verifier));
        console.log("Verification Key Hash:", verifier.verificationKeyHash());
        console.log("Number of public inputs:", verifier.NUM_PUBLIC_INPUTS());
        console.log("Number of IC points:", verifier.getICPointsCount());
    }
}
