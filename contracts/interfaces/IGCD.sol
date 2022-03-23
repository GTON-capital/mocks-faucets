//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IGCD is IERC20 {
    /**
     Function mints given amount of token to the specified address.
     Available for owner only (Minter contract)
     */
    function mint(address to, uint amount) external;
}
