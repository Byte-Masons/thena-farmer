async function main() {
  const vaultAddress = '0x3B9058D450F214796B581A7A011bF5Db7eA31724';
  const strategyAddress = '0x2b623bB360aDFfAc0fA6a538ae89170b0E165aBE';

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
