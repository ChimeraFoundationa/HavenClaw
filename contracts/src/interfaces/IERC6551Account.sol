// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title IERC6551Account
 * @dev Interface for ERC6551 Token Bound Account
 */
interface IERC6551Account is IERC165 {
    function state() external view returns (uint256);

    function execute(
        address to,
        uint256 value,
        bytes calldata data,
        uint256 operation,
        uint256 nonce
    ) external payable returns (bytes memory result);

    function owner() external view returns (address);
}
