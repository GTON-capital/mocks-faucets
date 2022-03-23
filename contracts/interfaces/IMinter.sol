//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMinter {

    /**
     Function creates bond nft and send it to user
     amount - amount of gton to be
     @return id issued bond id
     */
    function mint(uint amount) external returns(uint id);

    /**
     Function claims bond from user and sends GCD to user
     id - id of bond to be claimed
     */
    function claim(uint bondId) external;

    event Mint(address user, uint bondId);
}
