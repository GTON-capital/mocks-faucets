//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import { IMinter } from "./interfaces/IMinter.sol";
import { IGCD } from "./interfaces/IGCD.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Holder } from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract Minter is IMinter, ERC721Holder {

    constructor(ERC20 _gton, IGCD _gcd, ERC721 _bond, AggregatorV3Interface _price) {
        bond = _bond;
        gton = _gton;
        gcd = _gcd;
        gtonPrice = _price;
    }

    // ---------- Variables -----------

    AggregatorV3Interface public gtonPrice;


    // ---------- Constants -----------
    ERC721 immutable public bond;
    ERC20 immutable public gton;
    IGCD immutable public gcd;

    function mint(uint amount) public override returns(uint id) {
        gton.transferFrom(msg.sender, address(this), amount);
        (,int256 price,,,) = gtonPrice.latestRoundData();
        uint8 decimals = gtonPrice.decimals();
        uint mintAmount = amount * uint(price) / decimals;
        gcd.mint(address(this), mintAmount);

        // TODO put gcd + gton to PMM
        // TODO issue bond
    }

    function claim(uint bondId) public override {

    }
}
