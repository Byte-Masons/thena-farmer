async function main() {
   
    const strategyAddress = '0x64BAFF2eB676cF1f773861DD529fbF86F24C6aAD';
  
    const Strategy = await ethers.getContractFactory('ReaperStrategyTHENABUSDStable');
    const strat = Strategy.attach(strategyAddress);

    const busdAddress = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';
    const stableAddress = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d';
    const theAddress = '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11';
    const wbnbAddress = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';


    //await strat.updateSwapPath(busdAddress, stableAddress, [busdAddress, stableAddress]);
    //await strat.updateSwapPath(theAddress, busdAddress, [theAddress, wbnbAddress, busdAddress]);

    await strat.setStableSwap(busdAddress, stableAddress, true);
    console.log('Vault initialized');
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  