//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDODODppProxy {

  function resetDODOPrivatePool(
        address dppAddress,
        uint256[] memory paramList,  //0 - newLpFeeRate, 1 - newK
        uint256[] memory amountList, //0 - baseInAmount, 1 - quoteInAmount, 2 - baseOutAmount, 3- quoteOutAmount
        uint8 flag, //0 - ERC20, 1 - baseInETH, 2 - quoteInETH, 3 - baseOutETH, 4 - quoteOutETH
        uint256 minBaseReserve,
        uint256 minQuoteReserve,
        uint256 deadLine
    ) external payable;
}
