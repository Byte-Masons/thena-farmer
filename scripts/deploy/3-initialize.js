async function main() {
  const vaultAddress = '0xA6C800230c661Ec19AB6D5d642088109e9805BCA';
  const strategyAddress = '0x8Ed7B1057ED5F41c87538Ca3F1E75631E05879B1';

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
