async function main() {
  const stratFactory = await ethers.getContractFactory('ReaperStrategyTHENA');
  const stratContract = await hre.upgrades.prepareUpgrade('0xE289916E103489F8eaE2887C8bbb16E8E01CaFF2', stratFactory, {kind: 'uups'});
  console.log(stratContract);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
