// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IZKVerifier} from "../interfaces/IZKVerifier.sol";

/**
 * @title MockZKVerifier
 * @dev Mock ZK verifier for testing - always returns true
 */
contract MockZKVerifier is IZKVerifier {
    uint256 public constant NUM_PUBLIC_INPUTS = 1;
    
    bool public shouldVerify = true;
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    function verify(bytes calldata, bytes32[] calldata) external view override returns (bool) {
        return shouldVerify;
    }
    
    function setVerify(bool _shouldVerify) external {
        require(msg.sender == owner, "Not authorized");
        shouldVerify = _shouldVerify;
    }
}
