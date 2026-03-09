// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SimpleNFT} from "../src/test/SimpleNFT.sol";

contract DeploySimpleNFT is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying SimpleNFT...");
        SimpleNFT nft = new SimpleNFT();
        console.log("SimpleNFT deployed at:", address(nft));

        // Mint NFT to deployer
        uint256 tokenId = nft.safeMint(msg.sender);
        console.log("Minted Token ID:", tokenId);

        vm.stopBroadcast();

        console.log("\n=== SimpleNFT Deployment Complete ===\n");
        console.log("SimpleNFT:", address(nft));
        console.log("Your Token ID:", tokenId);
    }
}
