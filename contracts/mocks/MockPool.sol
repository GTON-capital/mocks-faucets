//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IPMM } from "../interfaces/IPMM.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockPMM is IPMM {

    IERC20 public gton;
    IERC20 public gcd;

    constructor(IERC20 _gton, IERC20 _gcd)  {
        gton = _gton;
        gcd = _gcd;
    }

    function updateBid(uint amount) public override {
        gcd.transferFrom(msg.sender, address(this), amount);
    }

    function updateAsk(uint amount) public override {
        gton.transferFrom(msg.sender, address(this), amount);
    }
}