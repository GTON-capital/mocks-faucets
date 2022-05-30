//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IBondNFT is IERC721 {
    function mint(address to, uint amount, uint releaseTs) external returns(uint id);
}
