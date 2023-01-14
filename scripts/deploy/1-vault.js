async function main() {
  const Vault = await ethers.getContractFactory('ReaperVaultv1_4');

  const wantAddress = '0x1d168C5b5DEa1c6dA0E9FD9bf4B7607e4e9D8EeC ';
  const tokenName = 'Thena vAMM-ETH/WBNB Vault';
  const tokenSymbol = 'rfvAMM-ETH/WBNB';
  const depositFee = 0;
  const tvlCap = ethers.constants.MaxUint256;

  const vault = await Vault.deploy(wantAddress, tokenName, tokenSymbol, depositFee, tvlCap);

  await vault.deployed();
  console.log('Vault deployed to:', vault.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
