async function main() {
   
    const strategyAddress = '0x25C9A46a27a20A48806C3f7Df96C01626faeB0AD';
  
    const Strategy = await ethers.getContractFactory('ReaperStrategyTHENABUSDStable');
    const strat = Strategy.attach(strategyAddress);

    const busdAddress = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';
    const stableAddress = '0x55d398326f99059fF775485246999027B3197955';
    const theAddress = '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11';
    const wbnbAddress = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';


    await strat.updateSwapPath(busdAddress, stableAddress, [busdAddress, stableAddress]);
    //await strat.updateSwapPath(theAddress, busdAddress, [theAddress, wbnbAddress, busdAddress]);

    //await strat.setStableSwap(busdAddress, stableAddress, true);
    console.log('Vault initialized');
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  