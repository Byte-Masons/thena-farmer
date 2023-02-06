async function main() {
  const vaultAddress = '0x3670803de0EE59AEd15Ad70825BBbede64EDf15E';
  const strategyAddress = '0x25C9A46a27a20A48806C3f7Df96C01626faeB0AD';

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
