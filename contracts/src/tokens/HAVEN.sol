// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";
import "../interfaces/IHAVEN.sol";

/// @title HAVEN - Haven Governance Token
/// @notice ERC20 governance token with voting capabilities
contract HAVEN is ERC20, Ownable, IHAVEN, IVotes, Nonces {
    struct Checkpoint {
        uint32 fromBlock;
        uint224 votes;
    }
    
    mapping(address => mapping(uint32 => Checkpoint)) private _checkpoints;
    mapping(address => uint32) private _numCheckpoints;
    mapping(address => address) private _delegates;
    
    constructor(uint256 initialSupply) ERC20("Haven", "HAVEN") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * 1e18);
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    function delegates(address account) external view returns (address) {
        return _delegates[account];
    }
    
    function delegate(address delegatee) external {
        _delegate(msg.sender, delegatee);
    }
    
    function delegateBySig(
        address delegatee,
        uint256 nonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(block.timestamp <= expiry, "Votes: signature expired");
        
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)"),
                delegatee,
                nonce,
                expiry
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR(),
                structHash
            )
        );
        
        address signer = ecrecover(digest, v, r, s);
        require(signer != address(0), "Votes: invalid signature");
        require(nonce == _useNonce(signer), "Votes: invalid nonce");
        require(signer == msg.sender, "Votes: invalid signer");
        
        _delegate(signer, delegatee);
    }
    
    function getVotes(address account) external view returns (uint256) {
        return _getVotes(account, block.number);
    }
    
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256) {
        require(blockNumber < block.number, "Not past block");
        return _getVotes(account, blockNumber);
    }
    
    function getPastTotalSupply(uint256) external pure returns (uint256) {
        return 0;
    }
    
    function _getVotes(address account, uint256 blockNumber) internal view returns (uint256) {
        address delegatee = _delegates[account];
        if (delegatee == address(0)) {
            return 0;
        }
        
        uint32 numCheckpoints = _numCheckpoints[delegatee];
        if (numCheckpoints == 0) {
            return 0;
        }
        
        uint32 low = 0;
        uint32 high = numCheckpoints - 1;
        
        while (low < high) {
            uint32 mid = (low + high + 1) / 2;
            if (_checkpoints[delegatee][mid].fromBlock <= blockNumber) {
                low = mid;
            } else {
                high = mid - 1;
            }
        }
        
        return _checkpoints[delegatee][low].votes;
    }
    
    function _delegate(address delegator, address delegatee) internal {
        address currentDelegate = _delegates[delegator];
        _delegates[delegator] = delegatee;
        
        emit DelegateChanged(delegator, currentDelegate, delegatee);
        
        _moveDelegateVotes(currentDelegate, delegatee, balanceOf(delegator));
    }
    
    function _moveDelegateVotes(address from, address to, uint256 amount) internal {
        if (from != address(0) && from != to) {
            _writeCheckpoint(from, balanceOf(from));
        }
        if (to != address(0)) {
            _writeCheckpoint(to, balanceOf(to));
        }
    }
    
    function _writeCheckpoint(address delegatee, uint256 votes) internal {
        uint32 numCheckpoints = _numCheckpoints[delegatee];
        uint32 blockNum = uint32(block.number);
        
        if (numCheckpoints > 0 && _checkpoints[delegatee][numCheckpoints - 1].fromBlock == blockNum) {
            _checkpoints[delegatee][numCheckpoints - 1].votes = uint224(votes);
        } else {
            _checkpoints[delegatee][numCheckpoints] = Checkpoint(blockNum, uint224(votes));
            _numCheckpoints[delegatee] = numCheckpoints + 1;
        }
    }
    
    function DOMAIN_SEPARATOR() public view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name())),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }
    
    function _update(address from, address to, uint256 value) internal override {
        super._update(from, to, value);
        
        if (from != address(0)) {
            address fromDelegate = _delegates[from];
            if (fromDelegate != address(0)) {
                _writeCheckpoint(fromDelegate, balanceOf(from));
            }
        }
        if (to != address(0)) {
            address toDelegate = _delegates[to];
            if (toDelegate != address(0)) {
                _writeCheckpoint(toDelegate, balanceOf(to));
            }
        }
    }
}
