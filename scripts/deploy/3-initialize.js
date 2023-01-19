async function main() {
  const vaultAddress = '0x41fce8Ebd2E05dff0488f67b48b03C73B01098b1';
  const strategyAddress = '0xFC008C0a477C627E18e52f5541f54ff2e17DbE66';

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
