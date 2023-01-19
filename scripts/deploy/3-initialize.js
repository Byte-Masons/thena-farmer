async function main() {
  const vaultAddress = '0x02417AC802741F81d84e9E52E524433fce1fCf3e';
  const strategyAddress = '0xCE1a9cF9266b03404c43C8B0Da1ae833A6F922c7';

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
