// SPDX-License-Identifier: MIT

pragma solidity >= 0.8.15;

import { InitializableOwnable } from "./InitializableOwnable.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

contract Faucet is InitializableOwnable  {
     
    mapping(address => mapping(address => uint)) public lastPayouts;
    mapping(address => uint) public intervals;
    mapping(address => uint) public payouts;

    constructor(
    ) {
        initOwner(msg.sender);
    }

    // Sends the amount of token to the caller.
    function pour(address tokenAddress) external {
        require(payouts[tokenAddress] > 0, "FaucetError: Unsupported token");

        IERC20 token = IERC20(tokenAddress);
        uint amount = payouts[tokenAddress] * (10 ** token.decimals());
        require(token.balanceOf(address(this)) > amount, "FaucetError: Empty");
        require(block.timestamp - lastPayouts[tokenAddress][msg.sender] > intervals[tokenAddress], "FaucetError: Try again later");
    
        lastPayouts[tokenAddress][msg.sender] = block.timestamp;
        
        require(token.transfer(msg.sender, amount));
    }  

    // Updates the underlying token address
    function addTokenAddress(
        address tokenAddress
    ) external onlyOwner {
        tokenAddress = tokenAddress;
        intervals[tokenAddress] = 86400;
        payouts[tokenAddress] = 50;
    } 

    // Updates the interval
    function setFaucetInterval(
        address tokenAddress,
        uint256 interval
    ) external onlyOwner {
        intervals[tokenAddress] = interval;
    }

    // Updates the amount paid
    function setAmount(
        address tokenAddress,
        uint256 amount
    ) external onlyOwner {
        payouts[tokenAddress] = amount;
    }

    // Allows the owner to withdraw tokens from the contract.
    function withdrawToken(IERC20 tokenToWithdraw, address to, uint amount) public onlyOwner {
        require(tokenToWithdraw.transfer(to, amount));
    }
}
