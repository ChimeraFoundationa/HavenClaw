// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC6551Account } from "../interfaces/IERC6551Account.sol";
import { IERC6551Registry } from "../interfaces/IERC6551Registry.sol";

/// @title ERC6551Account
/// @notice ERC-6551 Token Bound Account implementation
/// @dev This is the account implementation that gets deployed for each NFT
contract ERC6551Account is IERC6551Account {
    /// @notice Account state
    uint256 public override state;

    /// @notice Account implementation
    address public implementation;

    /// @notice Chain ID
    uint256 public chainId;

    /// @notice Token contract
    address public tokenContract;

    /// @notice Token ID
    uint256 public tokenId;

    /// @notice Salt used for account creation
    uint256 public salt;

    /// @notice ERC-6551 Registry
    IERC6551Registry public registry;

    /// @notice Constructor - called during CREATE2
    /// @param implementation_ The account implementation address
    /// @param chainId_ The chain ID
    /// @param tokenContract_ The ERC721 token contract address
    /// @param tokenId_ The token ID
    /// @param salt_ The salt for account creation
    constructor(address implementation_, uint256 chainId_, address tokenContract_, uint256 tokenId_, uint256 salt_) {
        implementation = implementation_;
        chainId = chainId_;
        tokenContract = tokenContract_;
        tokenId = tokenId_;
        salt = salt_;
        state = 0;
    }

    /// @notice Execute a transaction from the token bound account
    /// @param to The target address to call
    /// @param value The ETH value to send
    /// @param data The calldata to pass
    /// @param operation The operation type (0 = CALL, 1 = DELEGATECALL)
    /// @return result The return data from the call
    function execute(address to, uint256 value, bytes calldata data, uint8 operation)
        external
        payable
        override
        returns (bytes memory result)
    {
        // Verify caller is the token owner
        _verifyOwner();

        // Increment state nonce
        state++;

        if (operation == 0) {
            // CALL operation
            (bool success, bytes memory returnData) = to.call{ value: value }(data);
            if (!success) {
                // Revert with the reason
                assembly {
                    revert(add(returnData, 32), mload(returnData))
                }
            }
            result = returnData;
        } else if (operation == 1) {
            // DELEGATECALL operation
            (bool success, bytes memory returnData) = to.delegatecall(data);
            if (!success) {
                assembly {
                    revert(add(returnData, 32), mload(returnData))
                }
            }
            result = returnData;
        } else {
            revert("ERC6551: Invalid operation");
        }

        return result;
    }

    /// @notice Get the token bound account details
    /// @return chainId_ The chain ID
    /// @return tokenContract_ The ERC721 token contract address
    /// @return tokenId_ The token ID
    /// @return implementation_ The account implementation address
    function token()
        external
        view
        override
        returns (uint256 chainId_, address tokenContract_, uint256 tokenId_, address implementation_)
    {
        return (chainId, tokenContract, tokenId, implementation);
    }

    /// @notice Verify the caller is the token owner
    function _verifyOwner() internal view {
        // Get the owner of the NFT
        address owner = _getOwner();
        if (msg.sender != owner) {
            revert("ERC6551: Not token owner");
        }
    }

    /// @notice Get the owner of the token
    /// @return owner The token owner address
    function _getOwner() internal view returns (address owner) {
        // Call ownerOf on the token contract
        (bool success, bytes memory data) =
            tokenContract.staticcall(abi.encodeWithSignature("ownerOf(uint256)", tokenId));

        if (!success) {
            // Try ERC1155 balance check as fallback
            (success, data) = tokenContract.staticcall(
                abi.encodeWithSignature("balanceOf(address,uint256)", address(this), tokenId)
            );
            if (success && data.length == 32) {
                uint256 balance = abi.decode(data, (uint256));
                if (balance > 0) {
                    // For ERC1155, we need to find the owner differently
                    // This is a simplified version
                    revert("ERC6551: ERC1155 not fully supported");
                }
            }
            revert("ERC6551: Token not found");
        }

        owner = abi.decode(data, (address));
    }

    /// @notice Receive ETH
    receive() external payable { }

    /// @notice Fallback function
    fallback() external payable { }
}
