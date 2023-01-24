async function main() {
  const vaultAddress = '0xbe353C2B40Ec751C82fe6bdAB657f836f8D81D4a';
  const strategyAddress = '0x2d98447ce621BAB5e890562CC0174C329aAC0420';

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
