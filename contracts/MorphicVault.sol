// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.md";
import "@openzeppelin/contracts/access/Ownable.md";

/**
 * @title MorphicVault
 * @dev A vault for pooling assets on Arc Network before shielding.
 */
contract MorphicVault is Ownable {
    IERC20 public usdc;
    
    event Shielded(address indexed user, uint256 amount, string privateAddress);
    event Unshielded(address indexed user, uint256 amount);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    /**
     * @dev Deposit USDC into the vault to be shielded.
     * In a real implementation on Arc, this would interface with the native privacy layer.
     */
    function deposit(uint256 amount, string calldata privateAddress) external {
        require(amount > 0, "Amount must be greater than 0");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        emit Shielded(msg.sender, amount, privateAddress);
    }

    /**
     * @dev Withdraw USDC from the vault after unshielding.
     */
    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(usdc.transfer(msg.sender, amount), "Transfer failed");
        
        emit Unshielded(msg.sender, amount);
    }
}
