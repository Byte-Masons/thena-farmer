async function main() {
  const vaultAddress = '0x1f854b4889691012F33B5863Bf6DAB4ceEdD96a9';
  const strategyAddress = '0x64BAFF2eB676cF1f773861DD529fbF86F24C6aAD';

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
