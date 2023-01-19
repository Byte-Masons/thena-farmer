async function main() {
  const vaultAddress = '0xFF6C6Ea9784CC94B24Ec9140A53A384eCf00D170';
  const strategyAddress = '0xFb4e856c44Bf7F346B11D6665BE9b35b2E33Fd29';

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
