async function main() {
  const vaultAddress = '0x4E5300Daf44E371Ef095AA531FE7c15D6641651f';
  const strategyAddress = '0x40018e3E32D95d1200873Bd6Ed2CE19dB4a702cD';

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
