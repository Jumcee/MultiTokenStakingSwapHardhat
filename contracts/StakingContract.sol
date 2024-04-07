// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IUniswapRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

contract StakingContract is Ownable {
    address public swapRouterAddress;
    address[] public tokensToSwap;
    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public rewards;

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event RewardClaimed(address indexed account, uint256 amount);

    constructor(
        address _swapRouterAddress,
        address[] memory _tokensToSwap
    ) Ownable(msg.sender) {
        swapRouterAddress = _swapRouterAddress;
        tokensToSwap = _tokensToSwap;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        IERC20(tokensToSwap[0]).transferFrom(msg.sender, address(this), amount);
        stakedBalances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(stakedBalances[msg.sender] >= amount, "Insufficient balance");
        stakedBalances[msg.sender] -= amount;
        IERC20(tokensToSwap[0]).transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function claimRewards() external {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        rewards[msg.sender] = 0;
        IERC20(tokensToSwap[0]).transfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
    }

    function swapTokens(uint256 amount, address tokenIn, address tokenOut) internal {
        IUniswapRouter router = IUniswapRouter(swapRouterAddress);
        IERC20(tokenIn).approve(swapRouterAddress, amount);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        router.swapExactTokensForTokens(amount, 0, path, address(this), block.timestamp + 3600);
    }

    function addRewards(uint256 amount) external onlyOwner {
        IERC20(tokensToSwap[0]).transferFrom(msg.sender, address(this), amount);
        rewards[address(this)] += amount;
    }

    function withdrawExcessTokens(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(msg.sender, amount), "Transfer failed");
    }
}