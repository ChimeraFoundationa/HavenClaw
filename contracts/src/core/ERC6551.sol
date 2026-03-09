// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC6551Registry} from "../interfaces/IERC6551Registry.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title ERC6551Registry
 * @dev Simple ERC6551 Registry implementation
 */
contract ERC6551Registry is IERC6551Registry {
    error AccountCreationFailed();

    function account(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt
    ) public view returns (address) {
        return _computeAddress(implementation, chainId, tokenContract, tokenId, salt);
    }

    function createAccount(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt,
        bytes calldata initData
    ) external returns (address) {
        address deployedAccount = _computeAddress(implementation, chainId, tokenContract, tokenId, salt);

        if (deployedAccount.code.length != 0) {
            emit AccountCreated(deployedAccount, implementation, chainId, tokenContract, tokenId);
            return deployedAccount;
        }

        bytes memory bytecode = abi.encodePacked(
            type(ERC6551Account).creationCode,
            abi.encode(implementation, chainId, tokenContract, tokenId, salt)
        );

        address deployed;
        assembly {
            deployed := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }

        if (deployed == address(0)) {
            revert AccountCreationFailed();
        }

        if (initData.length > 0) {
            (bool success, ) = deployed.call(initData);
            if (!success) {
                revert AccountCreationFailed();
            }
        }

        emit AccountCreated(deployed, implementation, chainId, tokenContract, tokenId);
        return deployed;
    }

    function _computeAddress(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt
    ) internal view returns (address) {
        bytes32 bytecodeHash = keccak256(
            abi.encodePacked(
                type(ERC6551Account).creationCode,
                abi.encode(implementation, chainId, tokenContract, tokenId, salt)
            )
        );

        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            address(this),
                            salt,
                            bytecodeHash
                        )
                    )
                )
            )
        );
    }
}

/**
 * @title ERC6551Account
 * @dev Minimal Token Bound Account implementation
 */
contract ERC6551Account {
    error TokenContractMismatch();
    error InvalidChainId();
    error CallFailed();
    error NotOwner();

    uint256 public immutable chainId;
    address public immutable tokenContract;
    uint256 public immutable tokenId;

    constructor(
        address,
        uint256 chainId_,
        address tokenContract_,
        uint256 tokenId_,
        uint256
    ) {
        chainId = chainId_;
        tokenContract = tokenContract_;
        tokenId = tokenId_;

        // Verify NFT ownership
        try IERC721(tokenContract_).ownerOf(tokenId_) returns (address owner) {
            if (owner == address(0)) {
                revert TokenContractMismatch();
            }
        } catch {
            revert TokenContractMismatch();
        }
    }

    function state() external pure returns (uint256) {
        return 0;
    }

    function execute(
        address to,
        uint256 value,
        bytes calldata data,
        uint256 operation,
        uint256
    ) external payable returns (bytes memory result) {
        address owner_ = owner();
        require(owner_ != address(0), "Invalid owner");
        
        if (msg.sender != owner_) {
            revert NotOwner();
        }

        if (operation == 1) {
            revert(); // Delegatecall not supported
        }

        bool success;
        assembly {
            let dataPtr := data.offset
            let dataLen := data.length
            success := call(gas(), to, value, dataPtr, dataLen, 0, 0)
            returndatacopy(0, 0, returndatasize())
            result := mload(0)
        }

        if (!success) {
            revert CallFailed();
        }
    }

    function owner() public view returns (address) {
        if (block.chainid != chainId) {
            revert InvalidChainId();
        }

        // Use staticcall to avoid reentrancy issues
        (bool success, bytes memory data) = tokenContract.staticcall(
            abi.encodeWithSelector(IERC721.ownerOf.selector, tokenId)
        );

        if (!success || data.length != 32) {
            return address(0);
        }

        return abi.decode(data, (address));
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x6faff5f1 || // IERC6551Account
            interfaceId == 0x01ffc9a7;  // IERC165
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IERC721Receiver {
    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4);
}
