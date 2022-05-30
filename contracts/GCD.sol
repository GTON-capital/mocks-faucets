//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IGCD } from "./interfaces/IGCD.sol";

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract GCD is IGCD, ERC20, Ownable {

    constructor(
        string memory name, 
        string memory symbol
    ) ERC20(name, symbol) {
    }

    function mint(address to, uint amount) public override onlyOwner {
        _mint(to, amount);
    }
}
