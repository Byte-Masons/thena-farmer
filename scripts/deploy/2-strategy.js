const hre = require('hardhat');

async function main() {
  const vaultAddress = '';
  const gauge = '0x7144851e51523a88EA6BeC9710cC07f3a9B3baa7';

  const Strategy = await ethers.getContractFactory('ReaperStrategyTHENA');

  const treasuryAddress = '0x2d701da940342C9c41327e86C0e8BdC24b7D098b';

  const strategist1 = '0x1E71AEE6081f62053123140aacC7a06021D77348';
  const strategist2 = '0x81876677843D00a7D792E1617459aC2E93202576';
  const strategist3 = '0x1A20D7A31e5B3Bc5f02c8A146EF6f394502a10c4';
  const strategist4 = '0x4C3490dF15edFa178333445ce568EC6D99b5d71c'

  const superAdmin = '0x90c75c11735A7eeeD06E993fC7aF6838d86A1Ba7';
  const admin = '0xC17DfA7Eb4300871D5f022c107E07F98c750472e';
  const guardian = '0x30d65Ae22BBbe44208Dd8964DDE31Def0Fc1B9ee';

  const keeper1 = '';

  const strategy = await hre.upgrades.deployProxy(
    Strategy,
    [
      vaultAddress,
      treasuryAddress,
      [strategist1, strategist2, strategist3, strategist4],
      [superAdmin, admin, guardian],
      [keeper1],
      gauge
    ],
    {kind: 'uups', timeout: 0},
  );

  await strategy.deployed();
  console.log('Strategy deployed to:', strategy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
