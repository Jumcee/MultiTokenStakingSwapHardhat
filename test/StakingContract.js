const { expect } = require("chai");
const { ethers } = require("ethers");

describe("StakingContract", function () {
  let StakingContract;
  let stakingContract;
  let owner;
  let addr1;
  let addr2;
  let token;
  let tokenAddress;

  beforeEach(async function () {
    // Get the Ethereum provider from ethers
    const provider = ethers.provider;

    // Get the signers from the provider
    [owner, addr1, addr2] = await provider.getSigners();

    // Declare initialSupply here
    const initialSupply = ethers.utils.parseEther("1000000");

    // Deploy Token contract
    const Token = await ethers.getContractFactory("YourTokenContract");
    token = await Token.deploy(initialSupply);
    tokenAddress = token.address;

    // Deploy StakingContract
    const StakingContract = await ethers.getContractFactory("StakingContract");
    stakingContract = await StakingContract.deploy(owner.address, [tokenAddress]);
  });

  it("Should deposit tokens", async function () {
    const depositAmount = ethers.utils.parseEther("10");

    // Transfer tokens to addr1
    await token.transfer(addr1.address, depositAmount);

    // Approve StakingContract to spend tokens on behalf of addr1
    await token.connect(addr1).approve(stakingContract.address, depositAmount);

    // Deposit tokens to StakingContract
    await stakingContract.connect(addr1).deposit(depositAmount);

    // Check staked balances
    expect(await stakingContract.stakedBalances(addr1.address)).to.equal(depositAmount);
  });


  it("Should withdraw tokens", async function () {
    const depositAmount = ethers.utils.parseEther("10");
    const withdrawAmount = ethers.utils.parseEther("5");

    // Transfer tokens to addr1
    await token.transfer(addr1.address, depositAmount);

    // Approve StakingContract to spend tokens on behalf of addr1
    await token.connect(addr1).approve(stakingContract.address, depositAmount);

    // Deposit tokens to StakingContract
    await stakingContract.connect(addr1).deposit(depositAmount);

    // Withdraw tokens from StakingContract
    await stakingContract.connect(addr1).withdraw(withdrawAmount);

    // Check staked balances
    expect(await stakingContract.stakedBalances(addr1.address)).to.equal(depositAmount.sub(withdrawAmount));
  });

  it("Should add rewards", async function () {
    const rewardAmount = ethers.utils.parseEther("100");

    // Transfer tokens to StakingContract
    await token.transfer(stakingContract.address, rewardAmount);

    // Add rewards to StakingContract
    await stakingContract.addRewards(rewardAmount);

    // Check rewards balance
    expect(await token.balanceOf(stakingContract.address)).to.equal(rewardAmount);
  });

  it("Should claim rewards", async function () {
    const depositAmount = ethers.utils.parseEther("10");
    const rewardAmount = ethers.utils.parseEther("100");

    // Transfer tokens to addr1
    await token.transfer(addr1.address, depositAmount);

    // Approve StakingContract to spend tokens on behalf of addr1
    await token.connect(addr1).approve(stakingContract.address, depositAmount);

    // Deposit tokens to StakingContract
    await stakingContract.connect(addr1).deposit(depositAmount);

    // Transfer rewards to StakingContract
    await token.transfer(stakingContract.address, rewardAmount);

    // Claim rewards from StakingContract
    await stakingContract.connect(addr1).claimRewards();

    // Check rewards balance after claiming
    expect(await token.balanceOf(addr1.address)).to.equal(rewardAmount);
  });

  // Add more test cases as needed

});
