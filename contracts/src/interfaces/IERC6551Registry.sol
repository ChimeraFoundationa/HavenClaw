// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC6551Registry
 * @dev Interface for ERC6551 Registry
 */
interface IERC6551Registry {
    event AccountCreated(
        address account,
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    );

    function account(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt
    ) external view returns (address);

    function createAccount(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt,
        bytes calldata initData
    ) external returns (address);
}
