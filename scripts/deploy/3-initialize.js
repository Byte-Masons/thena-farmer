async function main() {
  const vaultAddress = '0xEF82fa5BC1E993E34F76C0b5Bf82942515C4F76e';
  const strategyAddress = '0xcf07F1955eA2b11C911C074A9b295BDD2fe7bAb5';

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
