//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import { IMinter } from "./interfaces/IMinter.sol";
import { IGCD } from "./interfaces/IGCD.sol";
import { IPMM } from "./interfaces/IPMM.sol";
import { BondNFT } from "./BondNFT.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC721Holder } from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract Minter is IMinter, ERC721Holder {

    constructor(
        ERC20 _gton, 
        IGCD _gcd, 
        BondNFT _bond, 
        AggregatorV3Interface _price, 
        IPMM _pool,
        uint _discountNominator
        ) {
        bond = _bond;
        gton = _gton;
        gcd = _gcd;
        gtonPrice = _price;
        pool = _pool;
        discountNominator = _discountNominator;
    }

    // ---------- Variables -----------
    uint public discountNominator;
    AggregatorV3Interface public gtonPrice;
    IPMM public pool;

    // ---------- Constants -----------
    uint immutable public denominator = 10000;
    BondNFT immutable public bond;
    ERC20 immutable public gton;
    IGCD immutable public gcd;

    // ---------- Views ---------------

    function amountWithoutDiscount(uint amount) public view returns(uint) {
        uint givenPercent = denominator - discountNominator;
        return amount * denominator / givenPercent;
    }

    // ---------- Methods -------------

    function mint(uint amount) external override returns(uint id) {
        gton.transferFrom(msg.sender, address(this), amount);
        (,int256 price,,,) = gtonPrice.latestRoundData();
        uint8 decimals = gtonPrice.decimals();
        uint mintAmount = amountWithoutDiscount(amount) * uint(price) / decimals;
        gcd.mint(address(this), mintAmount * 2);
        pool.updateAsk(amount); // gton
        pool.updateBid(mintAmount); // gcd
        id = bond.mint(msg.sender, mintAmount);
    }

    function claim(uint bondId) external override {
        // After transfer bond stays on the contract and can't be transfered etc, so we are safe here
        // And this transfer prevents from passing id that you do not own
        bond.safeTransferFrom(msg.sender, address(this), bondId);
        uint amount = bond.bondAmount(bondId);
        gcd.transfer(msg.sender, amount);
    }
}
