async function main() {
  const vaultAddress = '0x6f9E62aD4D0e70c64d5aA24ff71d4CFBE74C0E4b';
  const strategyAddress = '0x75405f2A80a32925975B2C6d6588D7F0C6f08de9';

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
