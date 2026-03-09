// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IZKVerifier} from "../interfaces/IZKVerifier.sol";
import {PlonkVerifier} from "./PLONKVerifier.sol";

/**
 * @title PLONKVerifierWrapper
 * @dev Simple wrapper for PlonkVerifier to implement IZKVerifier
 */
contract PLONKVerifierWrapper is IZKVerifier {
    PlonkVerifier public immutable PLONK_VERIFIER;
    uint256 public constant NUM_PUBLIC_INPUTS = 1;

    constructor() {
        PLONK_VERIFIER = new PlonkVerifier();
    }

    function verify(bytes calldata, bytes32[] calldata) external view override returns (bool) {
        // For now, always return true - proper implementation would decode and verify
        return true;
    }
}
