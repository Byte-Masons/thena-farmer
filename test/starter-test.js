/* eslint-disable prettier/prettier */
const hre = require('hardhat');
const chai = require('chai');
const {solidity} = require('ethereum-waffle');
chai.use(solidity);
const {expect} = chai;

const moveTimeForward = async (seconds) => {
  await network.provider.send('evm_increaseTime', [seconds]);
  await network.provider.send('evm_mine');
};

// use with small values in case harvest is block-dependent instead of time-dependent
const moveBlocksForward = async (blocks) => {
  for (let i = 0; i < blocks; i++) {
    await network.provider.send('evm_increaseTime', [1]);
    await network.provider.send('evm_mine');
  }
};

const toWantUnit = (num, isUSDC = false) => {
  if (isUSDC) {
    return ethers.BigNumber.from(num * 10 ** 8);
  }
  return ethers.utils.parseEther(num);
};

describe('Vaults', function () {
  let Vault;
  let vault;

  let Strategy;
  let strategy;

  let Want;
  let want;
  let dai;
  let usdc;

  const treasuryAddr = '0x1E71AEE6081f62053123140aacC7a06021D77348';
  const paymentSplitterAddress = '0x1E71AEE6081f62053123140aacC7a06021D77348';
  const wantAddress = '0x63Db6ba9E512186C2FAaDaCEF342FB4A40dc577c';
  const gauge = '0x638b0cc37ffe5a040079F75Ae6C50C9A386dDCaF';

  const wantHolderAddr = '0x60BC5E0440C867eEb4CbcE84bB1123fad2b262B1';
  const strategistAddr = '0x60BC5E0440C867eEb4CbcE84bB1123fad2b262B1';
  const defaultAdminAddress = '0x60BC5E0440C867eEb4CbcE84bB1123fad2b262B1';
  const adminAddress = '0x60BC5E0440C867eEb4CbcE84bB1123fad2b262B1';
  const guardianAddress = '0x60BC5E0440C867eEb4CbcE84bB1123fad2b262B1';

  // const beetsAddress = '';
  // const beetsHolderAddr = '';

  // const daiAddress = '';
  const usdcAddress = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'; // BUSD
  const veloAddress = '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11'; // THENA
  const opAddress = '0x4200000000000000000000000000000000000042';
  const lusdAddress = '0xc40F949F8a4e094D1b49a23ea9241D289B7b2819';
  const joinErcAddress = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; // wbnb

  let owner;
  let wantHolder;
  let strategist;
  let beetsHolder;

  beforeEach(async function () {
    //reset network
    await network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl: 'https://rpc.ankr.com/bsc',
            // blockNumber: 37848216,
          },
        },
      ],
    });

    //get signers
    [owner] = await ethers.getSigners();
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [wantHolderAddr],
    });
    wantHolder = await ethers.provider.getSigner(wantHolderAddr);
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [strategistAddr],
    });
    strategist = await ethers.provider.getSigner(strategistAddr);
    // await hre.network.provider.request({
    //   method: 'hardhat_impersonateAccount',
    //   params: [beetsHolderAddr],
    // });
    // beetsHolder = await ethers.provider.getSigner(beetsHolderAddr);

    // get artifacts
    Vault = await ethers.getContractFactory('ReaperVaultv1_4');
    Strategy = await ethers.getContractFactory('ReaperStrategyTHENA');
    Want = await ethers.getContractFactory('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20');

    // deploy contracts
    vault = await Vault.deploy(
      wantAddress,
      'Velodrome Crypt',
      'rfTest',
      0,
      ethers.constants.MaxUint256,
    );
    strategy = await hre.upgrades.deployProxy(
      Strategy,
      [
        vault.address,
        treasuryAddr,
        [strategistAddr],
        [defaultAdminAddress, adminAddress, guardianAddress],
        [strategistAddr],
        gauge
      ],
      {kind: 'uups'},
    );
    await strategy.deployed();
    await vault.initialize(strategy.address);
    console.log("here");

    await strategy.pause();
    // await strategy.addSwapStep(deusAddress, daiAddress, 1 /* total fee */, 0);
    // await strategy.addChargeFeesStep(daiAddress, 0 /* absolute */, 10_000);
    await strategy.unpause();

    want = await Want.attach(wantAddress);
    usdc = await Want.attach(usdcAddress);
    /***
     *    function setTHEToRelayPath(address[] memory _path) external {
        _atLeastRole(STRATEGIST);
        require(_path[0] == the && _path[_path.length - 1] == relay, "INVALID INPUT");
        THEToRelayPath = _path;
    }

    function setRelay(address _relay) external {
        _atLeastRole(STRATEGIST);
        require(_relay == lpToken0 || _relay == lpToken1, "INVALID INPUT");
        relay = _relay;
    }

    function setTHEToBUSDPath(address[] memory _path) external {
        _atLeastRole(STRATEGIST);
        require(_path[0] == the && _path[_path.length - 1] == busd, "INVALID INPUT");
        THEToBUSDPath = _path;
    }
}
     */

    //approving LP token and vault share spend
    await want.connect(wantHolder).approve(vault.address, ethers.constants.MaxUint256);
    await strategy.connect(wantHolder).setTHEToRelayPath([veloAddress, joinErcAddress]);
    await strategy.connect(wantHolder).setTHEToBUSDPath([veloAddress, usdcAddress]);
  });

  describe('Deploying the vault and strategy', function () {
    it('should initiate vault with a 0 balance', async function () {
      const totalBalance = await vault.balance();
      const availableBalance = await vault.available();
      const pricePerFullShare = await vault.getPricePerFullShare();
      expect(totalBalance).to.equal(0);
      expect(availableBalance).to.equal(0);
      expect(pricePerFullShare).to.equal(ethers.utils.parseEther('1'));
    });

    // Upgrade tests are ok to skip IFF no changes to BaseStrategy are made
    it('should not allow implementation upgrades without initiating cooldown', async function () {
      const StrategyV2 = await ethers.getContractFactory('ReaperStrategyTHENA2');
      await expect(hre.upgrades.upgradeProxy(strategy.address, StrategyV2)).to.be.revertedWith(
        'cooldown not initiated or still active',
      );
    });

    it('should not allow implementation upgrades before timelock has passed', async function () {
      await strategy.initiateUpgradeCooldown();

      const StrategyV2 = await ethers.getContractFactory('ReaperStrategyTHENA3');
      await expect(hre.upgrades.upgradeProxy(strategy.address, StrategyV2)).to.be.revertedWith(
        'cooldown not initiated or still active',
      );
    });

    it('should allow implementation upgrades once timelock has passed', async function () {
      const StrategyV2 = await ethers.getContractFactory('ReaperStrategyTHENA2');
      const timeToSkip = (await strategy.UPGRADE_TIMELOCK()).add(10);
      await strategy.initiateUpgradeCooldown();
      await moveTimeForward(timeToSkip.toNumber());
      await hre.upgrades.upgradeProxy(strategy.address, StrategyV2);
    });

    it('successive upgrades need to initiate timelock again', async function () {
      const StrategyV2 = await ethers.getContractFactory('ReaperStrategyTHENA2');
      const timeToSkip = (await strategy.UPGRADE_TIMELOCK()).add(10);
      await strategy.initiateUpgradeCooldown();
      await moveTimeForward(timeToSkip.toNumber());
      await hre.upgrades.upgradeProxy(strategy.address, StrategyV2);

      const StrategyV3 = await ethers.getContractFactory('ReaperStrategyTHENA3');
      await expect(hre.upgrades.upgradeProxy(strategy.address, StrategyV3)).to.be.revertedWith(
        'cooldown not initiated or still active',
      );

      await strategy.initiateUpgradeCooldown();
      await expect(hre.upgrades.upgradeProxy(strategy.address, StrategyV3)).to.be.revertedWith(
        'cooldown not initiated or still active',
      );

      await moveTimeForward(timeToSkip.toNumber());
      await hre.upgrades.upgradeProxy(strategy.address, StrategyV3);
    });
  });

  describe('Vault Tests', function () {
    it('should allow deposits and account for them correctly', async function () {
      const userBalance = await want.balanceOf(wantHolderAddr);
      const vaultBalance = await vault.balance();
      const depositAmount = toWantUnit('1');
      await vault.connect(wantHolder).deposit(depositAmount);

      const newVaultBalance = await vault.balance();
      const newUserBalance = await want.balanceOf(wantHolderAddr);
      const allowedInaccuracy = depositAmount.div(200);
      expect(depositAmount).to.be.closeTo(newVaultBalance, allowedInaccuracy);
    });

    it('should mint user their pool share', async function () {
      const userBalance = await want.balanceOf(wantHolderAddr);
      // const depositAmount = toWantUnit('0.0000001');
      const depositAmount = userBalance.div(10);
      await vault.connect(wantHolder).deposit(depositAmount);

      const ownerDepositAmount = userBalance.div(10);
      await want.connect(wantHolder).transfer(owner.address, ownerDepositAmount);
      await want.connect(owner).approve(vault.address, ethers.constants.MaxUint256);
      await vault.connect(owner).deposit(ownerDepositAmount);

      const allowedImprecision = toWantUnit('0.0001');

      const userVaultBalance = await vault.balanceOf(wantHolderAddr);
      expect(userVaultBalance).to.be.closeTo(depositAmount, allowedImprecision);
      const ownerVaultBalance = await vault.balanceOf(owner.address);
      expect(ownerVaultBalance).to.be.closeTo(ownerDepositAmount, allowedImprecision);

      await vault.connect(owner).withdrawAll();
      const ownerWantBalance = await want.balanceOf(owner.address);
      expect(ownerWantBalance).to.be.closeTo(ownerDepositAmount, allowedImprecision);
      const afterOwnerVaultBalance = await vault.balanceOf(owner.address);
      expect(afterOwnerVaultBalance).to.equal(0);
    });

    it('should allow withdrawals', async function () {
      const userBalance = await want.balanceOf(wantHolderAddr);
      const depositAmount = toWantUnit('1');
      await vault.connect(wantHolder).deposit(depositAmount);

      await vault.connect(wantHolder).withdrawAll();
      const newUserVaultBalance = await vault.balanceOf(wantHolderAddr);
      const userBalanceAfterWithdraw = await want.balanceOf(wantHolderAddr);

      const securityFee = 10;
      const percentDivisor = 10000;
      const withdrawFee = depositAmount.mul(securityFee).div(percentDivisor);
      const expectedBalance = userBalance.sub(withdrawFee);
      const smallDifference = expectedBalance.div(200);
      const isSmallBalanceDifference = expectedBalance.sub(userBalanceAfterWithdraw) < smallDifference;
      expect(isSmallBalanceDifference).to.equal(true);
    });

    it('should allow small withdrawal', async function () {
      const userBalance = await want.balanceOf(wantHolderAddr);
      const depositAmount = toWantUnit('0.0000001');
      await vault.connect(wantHolder).deposit(depositAmount);

      const ownerDepositAmount = toWantUnit('0.1');
      await want.connect(wantHolder).transfer(owner.address, ownerDepositAmount);
      await want.connect(owner).approve(vault.address, ethers.constants.MaxUint256);
      await vault.connect(owner).deposit(ownerDepositAmount);

      await vault.connect(wantHolder).withdrawAll();
      const newUserVaultBalance = await vault.balanceOf(wantHolderAddr);
      const userBalanceAfterWithdraw = await want.balanceOf(wantHolderAddr);

      const securityFee = 10;
      const percentDivisor = 10000;
      const withdrawFee = depositAmount.mul(securityFee).div(percentDivisor);
      const expectedBalance = userBalance.sub(withdrawFee);
      const smallDifference = expectedBalance.div(200);
      const isSmallBalanceDifference = expectedBalance.sub(userBalanceAfterWithdraw) < smallDifference;
      console.log(isSmallBalanceDifference);
      expect(isSmallBalanceDifference).to.equal(true);
    });

    it('should handle small deposit + withdraw', async function () {
      const userBalance = await want.balanceOf(wantHolderAddr);
      const depositAmount = toWantUnit('0.0000000000001');
      await vault.connect(wantHolder).deposit(depositAmount);

      await vault.connect(wantHolder).withdraw(depositAmount);
      const newUserVaultBalance = await vault.balanceOf(wantHolderAddr);
      const userBalanceAfterWithdraw = await want.balanceOf(wantHolderAddr);

      const securityFee = 10;
      const percentDivisor = 10000;
      const withdrawFee = (depositAmount * securityFee) / percentDivisor;
      const expectedBalance = userBalance.sub(withdrawFee);
      const isSmallBalanceDifference = expectedBalance.sub(userBalanceAfterWithdraw) < 200;
      expect(isSmallBalanceDifference).to.equal(true);
    });

    it('should be able to harvest', async function () {
      const userBalance = await want.balanceOf(wantHolderAddr);
      const depositAmount = userBalance.div(10);
      await vault.connect(wantHolder).deposit(depositAmount);
      // await moveBlocksForward(100);
      await moveTimeForward(3600 * 24);
      const readOnlyStrat = await strategy.connect(ethers.provider);
      const predictedCallerFee = await readOnlyStrat.callStatic.harvest();
      console.log(`predicted caller fee ${ethers.utils.formatEther(predictedCallerFee)}`);

      const usdcBalBefore = await usdc.balanceOf(owner.address);
      const tx = await strategy.harvest();
      const receipt = await tx.wait();
      console.log(`gas used ${receipt.gasUsed}`);
      const usdcBalAfter = await usdc.balanceOf(owner.address);
      const usdcBalDifference = usdcBalAfter.sub(usdcBalBefore);
      console.log(`actual caller fee ${ethers.utils.formatEther(usdcBalDifference)}`);
    });

    it('should provide yield', async function () {
      const userBalance = await want.balanceOf(wantHolderAddr);
      console.log(`user balance ${userBalance}`);
      const depositAmount = userBalance.div(10);
      const timeToSkip = 3600;
      await vault.connect(wantHolder).deposit(depositAmount);
      const initialVaultBalance = await vault.balance();

      await strategy.updateHarvestLogCadence(1);

      const numHarvests = 5;
      // beets = Want.attach(beetsAddress);
      for (let i = 0; i < numHarvests; i++) {
        // await beets.connect(beetsHolder).transfer(strategy.address, toWantUnit('1'));
      await moveTimeForward(3600 * 24);
        await strategy.harvest();
      }

      const finalVaultBalance = await vault.balance();
      expect(finalVaultBalance).to.be.gt(initialVaultBalance);

      const averageAPR = await strategy.averageAPRAcrossLastNHarvests(numHarvests);
      console.log(`Average APR across ${numHarvests} harvests is ${averageAPR} basis points.`);
    });
  });
  describe('Strategy', function () {
    it('should be able to pause and unpause', async function () {
      await strategy.pause();
      const depositAmount = toWantUnit('1');
      await expect(vault.connect(wantHolder).deposit(depositAmount)).to.be.reverted;

      await strategy.unpause();
      await expect(vault.connect(wantHolder).deposit(depositAmount)).to.not.be.reverted;
    });

    it('should be able to panic', async function () {
      const depositAmount = toWantUnit('0.0007');
      await vault.connect(wantHolder).deposit(depositAmount);
      const vaultBalance = await vault.balance();
      const strategyBalance = await strategy.balanceOf();
      await strategy.panic();

      const wantStratBalance = await want.balanceOf(strategy.address);
      const allowedImprecision = toWantUnit('0.000000001');
      expect(strategyBalance).to.be.closeTo(wantStratBalance, allowedImprecision);
    });
  });
});
