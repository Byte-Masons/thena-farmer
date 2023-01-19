async function main() {
  const vaultAddress = '0x5f3b1E13BE5d48D4FA0a6D922845931709DFc455';
  const strategyAddress = '0xE289916E103489F8eaE2887C8bbb16E8E01CaFF2';

  const Vault = await ethers.getContractFactory('ReaperVaultv1_4');
  const vault = Vault.attach(vaultAddress);

  await vault.initialize(strategyAddress);
  console.log('Vault initialized');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
