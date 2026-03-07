// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IERC6551Account
/// @notice Interface for ERC-6551 Token Bound Account
/// @dev https://eips.ethereum.org/EIPS/eip-6551
abstract contract IERC6551Account {
    /// @notice Execute a transaction from the token bound account
    /// @param to The target address to call
    /// @param value The ETH value to send
    /// @param data The calldata to pass
    /// @param operation The operation type (0 = CALL, 1 = DELEGATECALL)
    /// @return result The return data from the call
    function execute(address to, uint256 value, bytes calldata data, uint8 operation)
        external
        payable
        virtual
        returns (bytes memory result)
    { }

    /// @notice Get the state nonce for replay protection
    /// @return nonce The current state nonce
    function state() external view virtual returns (uint256 nonce) { }

    /// @notice Get the token bound account details
    /// @return chainId The chain ID
    /// @return tokenContract The ERC721 token contract address
    /// @return tokenId The token ID
    /// @return implementation The account implementation address
    function token()
        external
        view
        virtual
        returns (uint256 chainId, address tokenContract, uint256 tokenId, address implementation)
    { }
}
