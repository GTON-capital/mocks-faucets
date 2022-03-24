//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IBondNFT } from "./interfaces/IBondNFT.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";

contract BondNFT is IBondNFT, ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdTracker;
    // Probably it is possible to use uint[] here, but if so - fix Minter.sol 51 line
    mapping(uint => uint) public bondAmount;

    constructor(string memory name, string memory symbol) 
        ERC721(name, symbol) {}

    function mint(address to, uint amount) external override onlyOwner returns(uint id) {
        id = _tokenIdTracker.current();
        bondAmount[id] = amount;
        _mint(to, id);
        _tokenIdTracker.increment();
    }
}
