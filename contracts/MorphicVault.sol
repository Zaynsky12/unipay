// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MorphicVault
 * @dev A vault for pooling assets on Arc Network before shielding. Supports multiple ERC20 tokens.
 */
contract MorphicVault is Ownable {
    // Tracks allowed tokens
    mapping(address => bool) public supportedTokens;
    
    // Tracks shielded balance per user per token: user => token => balance
    mapping(address => mapping(address => uint256)) public balances;
    
    event Shielded(address indexed user, address indexed token, uint256 amount, string privateAddress);
    event Unshielded(address indexed user, address indexed token, uint256 amount);
    event TokenSupported(address indexed token, bool status);

    constructor(address[] memory initialTokens) Ownable(msg.sender) {
        for (uint i = 0; i < initialTokens.length; i++) {
            supportedTokens[initialTokens[i]] = true;
            emit TokenSupported(initialTokens[i], true);
        }
    }

    function setTokenSupport(address token, bool status) external onlyOwner {
        supportedTokens[token] = status;
        emit TokenSupported(token, status);
    }

    /**
     * @dev Deposit token into the vault to be shielded.
     */
    function deposit(address token, uint256 amount, string calldata privateAddress) external {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        balances[msg.sender][token] += amount;
        emit Shielded(msg.sender, token, amount, privateAddress);
    }

    /**
     * @dev Withdraw token from the vault after unshielding.
     */
    function withdraw(address token, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balances[msg.sender][token] >= amount, "Insufficient shielded balance");
        
        balances[msg.sender][token] -= amount;
        require(IERC20(token).transfer(msg.sender, amount), "Transfer failed");
        
        emit Unshielded(msg.sender, token, amount);
    }
}
