const { ethers } = require("ethers");
const { expect } = require("chai");
//const { ContractFactory } = ethers;

// Load the contract ABI and bytecode
// const contractABI = [...]; // Replace with the ABI of your contract
// const contractBytecode = "0x..."; // Replace with the bytecode of your contract

describe("StakingContract", function () {
  let StakingContract;
  let hardhatToken;
  let swapRouterAddress;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Get the ContractFactory and Signers
    const ERC20Factory = await ethers.getContractFactory("ERC20");
    hardhatToken = await ERC20Factory.deploy("Hardhat Token", "HHT", 18);
    await hardhatToken.deployed();

    // Use a mock for the UniswapRouter if you don't have the implementation
    const SwapRouterFactory = await ethers.getContractFactory("MockUniswapRouter");
    swapRouterAddress = await SwapRouterFactory.deploy();
    await swapRouterAddress.deployed();

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const StakingContractFactory = await ethers.getContractFactory("StakingContract");
    StakingContract = await StakingContractFactory.deploy(
      swapRouterAddress.address,
      [hardhatToken.address]
    );
    await StakingContract.deployed();
  });


  describe("Deployment", function () {
    it("Should set the right swap router address", async function () {
      expect(await StakingContract.swapRouterAddress()).to.equal(
        swapRouterAddress.address
      );
    });

    it("Should set the right tokens to swap", async function () {
      expect(await StakingContract.tokensToSwap(0)).to.equal(hardhatToken.address);
    });
  });

  describe("Deposit", function () {
    it("Should deposit tokens", async function () {
      const amount = ethers.utils.parseEther("100");
      await hardhatToken.approve(StakingContract.address, amount);
      await StakingContract.connect(addr1).deposit(amount);
      expect(await StakingContract.stakedBalances(addr1.address)).to.equal(amount);
    });
  });

  describe("Withdraw", function () {
    it("Should withdraw tokens", async function () {
      const amount = ethers.utils.parseEther("100");
      await hardhatToken.approve(StakingContract.address, amount);
      await StakingContract.connect(addr1).deposit(amount);
      await StakingContract.connect(addr1).withdraw(amount.div(2));
      expect(await StakingContract.stakedBalances(addr1.address)).to.equal(
        amount.div(2)
      );
    });
  });

  describe("Claim Rewards", function () {
    it("Should claim rewards", async function () {
      const amount = ethers.utils.parseEther("100");
      await hardhatToken.transfer(StakingContract.address, amount);
      await StakingContract.addRewards(amount);
      await StakingContract.connect(addr1).deposit(ethers.utils.parseEther("1"));
      await StakingContract.connect(addr1).claimRewards();
      expect(await hardhatToken.balanceOf(addr1.address)).to.be.gt(0);
    });
  });

  describe("Swap Tokens", function () {
    it("Should swap tokens", async function () {
      const ERC20Factory = await ethers.getContractFactory("ERC20Mock");
      const token2 = await ERC20Factory.deploy("Token 2", "TKN2", 18);
      await token2.deployed();

      const amount = ethers.utils.parseEther("100");
      await hardhatToken.transfer(StakingContract.address, amount);
      await StakingContract.swapTokens(amount, hardhatToken.address, token2.address);
      expect(await token2.balanceOf(StakingContract.address)).to.be.gt(0);
    });
  });

  describe("Add Rewards", function () {
    it("Should add rewards", async function () {
      const amount = ethers.utils.parseEther("100");
      await hardhatToken.approve(StakingContract.address, amount);
      await StakingContract.addRewards(amount);
      expect(await StakingContract.rewards(StakingContract.address)).to.equal(amount);
    });
  });

  describe("Withdraw Excess Tokens", function () {
    it("Should withdraw excess tokens", async function () {
      const amount = ethers.utils.parseEther("100");
      await hardhatToken.transfer(StakingContract.address, amount);
      await StakingContract.withdrawExcessTokens(hardhatToken.address, amount);
      expect(await hardhatToken.balanceOf(owner.address)).to.equal(amount);
    });
  });
});