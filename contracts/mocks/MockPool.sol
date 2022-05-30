//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IDODODppProxy } from "../interfaces/IDODODppProxy.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockPMM is IDODODppProxy {

    IERC20 public gton;
    IERC20 public gcd;

    constructor(IERC20 _gton, IERC20 _gcd)  {
        gton = _gton;
        gcd = _gcd;
    }

  function resetDODOPrivatePool(
        address dppAddress,
        uint256[] memory paramList,  //0 - newLpFeeRate, 1 - newK
        uint256[] memory amountList, //0 - baseInAmount, 1 - quoteInAmount, 2 - baseOutAmount, 3- quoteOutAmount
        uint8 flag, //0 - ERC20, 1 - baseInETH, 2 - quoteInETH, 3 - baseOutETH, 4 - quoteOutETH
        uint256 minBaseReserve,
        uint256 minQuoteReserve,
        uint256 deadLine
    ) external override payable {

    }

}