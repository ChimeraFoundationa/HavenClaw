// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleNFT
 * @dev Simple ERC721 NFT for TBA testing (no ERC-8004 complexity)
 */
contract SimpleNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("SimpleNFT", "SNFT") Ownable(msg.sender) {}

    function safeMint(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return "ipfs://QmSimpleNFT";
    }
}
