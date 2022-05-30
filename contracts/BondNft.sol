//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IBondNFT } from "./interfaces/IBondNFT.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";

contract BondNFT is IBondNFT, ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdTracker;

    struct BondInfo {
        uint amount;
        uint releaseTs;
    }

    mapping(uint => BondInfo) public bondInfo;

    constructor(string memory name, string memory symbol) 
        ERC721(name, symbol) {}

    function mint(address to, uint amount, uint releaseTs) external override onlyOwner returns(uint id) {
        id = _tokenIdTracker.current();
        bondInfo[id] = BondInfo(amount, releaseTs);
        _mint(to, id);
        _tokenIdTracker.increment();
        emit Mint(id, to);
    }

    event Mint(uint id, address to);
}
