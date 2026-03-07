// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC6551Registry } from "../interfaces/IERC6551Registry.sol";
import { ERC6551Account } from "./ERC6551Account.sol";

/// @title ERC6551Registry
/// @notice Reference implementation of ERC-6551 Registry for Token Bound Accounts
/// @dev https://eips.ethereum.org/EIPS/eip-6551
contract ERC6551Registry is IERC6551Registry {
    /// @notice Mapping from account address to account creation parameters
    mapping(address => AccountParams) public accountParams;

    struct AccountParams {
        address implementation;
        uint256 chainId;
        address tokenContract;
        uint256 tokenId;
        uint256 salt;
    }

    /// @notice Mapping from hash of parameters to account address
    mapping(bytes32 => address) public accounts;

    /// @notice Create a token bound account for a given token
    /// @dev Uses CREATE2 for deterministic address generation
    /// @param implementation The implementation address for the account
    /// @param chainId The chain ID for the account
    /// @param tokenContract The ERC721 token contract address
    /// @param tokenId The token ID
    /// @param salt Optional salt for deterministic address generation
    /// @return The created or existing account address
    function createAccount(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt
    ) external returns (address) {
        // Compute the account address
        address accountAddr = account(implementation, chainId, tokenContract, tokenId, salt);

        // Check if account already exists
        if (accountAddr.code.length > 0) {
            return accountAddr;
        }

        // Create the account using CREATE2
        bytes memory bytecode = abi.encodePacked(
            type(ERC6551Account).creationCode, abi.encode(implementation, chainId, tokenContract, tokenId, salt)
        );

        assembly {
            accountAddr := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }

        if (accountAddr == address(0)) {
            revert("ERC6551: CREATE2 failed");
        }

        // Store account parameters
        accountParams[accountAddr] = AccountParams({
            implementation: implementation, chainId: chainId, tokenContract: tokenContract, tokenId: tokenId, salt: salt
        });

        // Emit event
        emit AccountCreated(accountAddr, implementation, chainId, tokenContract, tokenId);
    }

    /// @notice Get the account address for a given token
    /// @param implementation The implementation address for the account
    /// @param chainId The chain ID for the account
    /// @param tokenContract The ERC721 token contract address
    /// @param tokenId The token ID
    /// @param salt Optional salt for deterministic address generation
    /// @return account The account address
    function account(address implementation, uint256 chainId, address tokenContract, uint256 tokenId, uint256 salt)
        public
        view
        returns (address)
    {
        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encode(
                            keccak256("eip6551Account(address,uint256,address,uint256,uint256)"),
                            implementation,
                            chainId,
                            tokenContract,
                            tokenId,
                            salt
                        )
                    )
                )
            )
        );
    }
}
