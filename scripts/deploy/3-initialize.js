async function main() {
  const vaultAddress = '0x4e5C3b854364BD9260380194fDBa7F7aab87De42';
  const strategyAddress = '0x8B80A8701A339620d45e47762B1568b9c3Ac3A17';

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
