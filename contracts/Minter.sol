//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import { IMinter } from "./interfaces/IMinter.sol";
import { IGCD } from "./interfaces/IGCD.sol";
import { IDODODppProxy } from "./interfaces/IDODODppProxy.sol";
import { BondNFT } from "./BondNFT.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC721Holder } from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract Minter is IMinter, ERC721Holder, Ownable {

    constructor(
        ERC20 _gton, 
        IGCD _gcd, 
        BondNFT _bond, 
        AggregatorV3Interface _price, 
        IDODODppProxy _poolProxy,
        address _approveAddress,
        address _dppPool,
        uint _discountNominator,
        uint _lockPeriod
        ) {
        bond = _bond;
        gton = _gton;
        gcd = _gcd;
        gtonPrice = _price;
        poolProxy = _poolProxy;
        approveAddress = _approveAddress;
        dppPool = _dppPool;
        discountNominator = _discountNominator;
        lockPeriod = _lockPeriod;
    }

    // ---------- Variables -----------
    uint public discountNominator;
    uint public lockPeriod;
    address public approveAddress;
    address public dppPool;
    AggregatorV3Interface public gtonPrice;
    IDODODppProxy public poolProxy;
    uint[] public dppParams = [0, 1e12];
    
    // it's necessary to use the storage amounts variable to make compatible input call for dodo pool
    // every uint[] memory initialization will cause the fixed array error (input expects not fixed array)
    uint[] private dppAmounts = [0, 0, 0, 0];

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
        gton.approve(approveAddress, amount);
        gcd.approve(approveAddress, mintAmount);
        // id's 2 and 3 are zeros by default. See IDODOppProxy notation
        dppAmounts.push(amount);
        dppAmounts.push(mintAmount);
        // by default gton is base and gcd is quote
        poolProxy.resetDODOPrivatePool(dppPool, dppParams, dppAmounts, 0, 0, 0, block.timestamp + 1000);
        uint releaseTs = block.timestamp + lockPeriod;
        id = bond.mint(msg.sender, mintAmount, releaseTs);
    }

    function claim(uint bondId) external override {
        // After transfer bond stays on the contract and can't be transfered etc, so we are safe here
        // And this transfer prevents from passing id that you do not own
        bond.safeTransferFrom(msg.sender, address(this), bondId);
        (uint amount, uint release) = bond.bondInfo(bondId);
        require(block.timestamp >= release, "Minter: cannot claim not expired bond"); 
        gcd.transfer(msg.sender, amount);
    }

    // ----------- Owner updates -----------

    function updateDiscount(uint discount) external onlyOwner {
        discountNominator = discount;
    } 

    function updateLockPeriod(uint period) external onlyOwner {
        lockPeriod = period;
    } 

    function updateGtonPrice(AggregatorV3Interface aggregator) external onlyOwner {
        gtonPrice = aggregator;
    } 

    function updatepoolProxy(IDODODppProxy _poolProxy) external onlyOwner {
        poolProxy = _poolProxy;
    } 

    function updatePoolParams(uint[] memory params) external onlyOwner {
        dppParams = params;
    } 

    function updateapproveAddress(address newProxy) external onlyOwner {
        approveAddress = newProxy;
    } 
}
