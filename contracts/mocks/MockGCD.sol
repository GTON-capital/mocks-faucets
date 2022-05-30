//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { InitializableOwnable } from "../interfaces/InitializableOwnable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract MockGCD is ERC20Burnable, InitializableOwnable {

    constructor(
        string memory _name, 
        string memory _symbol
    ) ERC20(_name, _symbol) {
        initOwner(msg.sender);
    }

    function mint(address to, uint amount) external onlyAdminOrOwner {
        _mint(to, amount);
    }
}
