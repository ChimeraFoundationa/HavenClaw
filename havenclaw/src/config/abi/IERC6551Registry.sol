// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IERC6551Registry
/// @notice Interface for ERC-6551 Registry contract
/// @dev https://eips.ethereum.org/EIPS/eip-6551
interface IERC6551Registry {
    /// @notice Emitted when a new token bound account is created
    event AccountCreated(
        address account,
        address indexed implementation,
        uint256 indexed chainId,
        address indexed tokenContract,
        uint256 tokenId
    );

    /// @notice Create a token bound account for a given token
    /// @param implementation The implementation address for the account
    /// @param chainId The chain ID for the account
    /// @param tokenContract The ERC721 token contract address
    /// @param tokenId The token ID
    /// @param salt Optional salt for deterministic address generation
    /// @return account The created or existing account address
    function createAccount(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt
    ) external returns (address account);

    /// @notice Get the account address for a given token
    /// @param implementation The implementation address for the account
    /// @param chainId The chain ID for the account
    /// @param tokenContract The ERC721 token contract address
    /// @param tokenId The token ID
    /// @param salt Optional salt for deterministic address generation
    /// @return account The account address
    function account(address implementation, uint256 chainId, address tokenContract, uint256 tokenId, uint256 salt)
        external
        view
        returns (address);
}
