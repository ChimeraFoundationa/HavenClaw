// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IHAVEN - HAVEN Token Interface
/// @notice Interface for HAVEN governance token (extends ERC20)
interface IHAVEN {
    // Minting (only for minter role)
    function mint(address to, uint256 amount) external;
    
    // Burning
    function burn(uint256 amount) external;
}
