// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./abstract/ReaperBaseStrategyv3.sol";
import "./interfaces/ITHERouter.sol";
import "./interfaces/ITHEPair.sol";
import "./interfaces/ITHEGauge.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

/// @dev Deposit and stake want in THENA Gauges. Harvests THE rewards and compounds.
contract ReaperStrategyTHENA is ReaperBaseStrategyv3 {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /// 3rd-party contract addresses
    address public constant THENA_ROUTER = address(0x20a304a7d126758dfe6B243D0fc515F83bCA8431);

    /// @dev Tokens Used:
    /// {BUSD} - Fees are charged in {BUSD}
    /// {THE} - THENA's reward
    /// {gauge} - Gauge where {want} is staked.
    /// {want} - Token staked.
    /// {lpToken0} - {want}'s underlying token.
    /// {lpToken1} - {want}'s underlying token.
    /// {relay} - lpToken {THE} gets swapped to before creating liquidity. //likely WBNB
    address public constant busd = address(0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56);
    address public constant the = address(0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11);
    address public gauge;
    address public want;
    address public lpToken0;
    address public lpToken1;
    address public relay;

    /// @dev Arrays
    /// {rewards} - Array need to claim rewards
    /// {THEToRelayPath} - Path from THE to relay
    /// {THEToBUSDPath} - Path from THE to BUSD
    address[] public rewards;
    address[] public THEToRelayPath;
    address[] public THEToBUSDPath;

    /// @dev Initializes the strategy. Sets parameters and saves routes.
    /// @notice see documentation for each variable above its respective declaration.
    function initialize(
        address _vault,
        address treasury,
        address[] memory _strategists,
        address[] memory _multisigRoles,
        address[] memory _keepers,
        address _gauge
    ) public initializer {
        __ReaperBaseStrategy_init(_vault, treasury, _strategists, _multisigRoles, _keepers);
        gauge = _gauge;
        want = ITHEGauge(gauge).TOKEN();
        (lpToken0, lpToken1) = ITHEPair(want).tokens();

        relay = lpToken1;
        // THE, WBNB, BUSD
        THEToBUSDPath = [the, address(0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c), busd];
        THEToRelayPath = [the];
        rewards.push(the);
    }

    /// @dev Function that puts the funds to work.
    ///      It gets called whenever someone deposits in the strategy's vault contract.
    function _deposit() internal override {
        uint256 wantBalance = IERC20Upgradeable(want).balanceOf(address(this));
        if (wantBalance != 0) {
            IERC20Upgradeable(want).safeIncreaseAllowance(gauge, wantBalance);
            ITHEGauge(gauge).deposit(wantBalance);
        }
    }

    /// @dev Withdraws funds and sends them back to the vault.
    function _withdraw(uint256 _amount) internal override {
        uint256 wantBal = IERC20Upgradeable(want).balanceOf(address(this));
        if (wantBal < _amount) {

            // Calculate how much to cWant this is
            uint256 remaining = _amount - wantBal;
            ITHEGauge(gauge).withdraw(remaining);
        }
        IERC20Upgradeable(want).safeTransfer(vault, _amount);
    }

    /// @dev Core function of the strat, in charge of collecting and re-investing rewards.
    ///      1. Claims {THE} from the {gauge}.
    ///      2. Claims fees in {BUSD} for the harvest caller and treasury.
    ///      3. Swaps the remaining rewards for {want} using {THENA_ROUTER}.
    ///      4. Deposits and stakes into {gauge}.
    function _harvestCore() internal override returns (uint256 callerFee) {
        ITHEGauge(gauge).getReward();
        callerFee = _chargeFees();
        _swapToRelay();
        _addLiquidity();
        deposit();
    }

    /// @dev Helper function to swap {_from} to {_to} given an {_amount}.
    function _swap(
        address _from,
        address _to,
        uint256 _amount
    ) internal {
        if (_from == _to || _amount == 0) {
            return;
        }

        IERC20Upgradeable(_from).safeIncreaseAllowance(THENA_ROUTER, _amount);
        ITHERouter router = ITHERouter(THENA_ROUTER);

        //(, bool useStable) = router.getAmountOut(_amount, _from, _to);
        ITHERouter.route[] memory routes = new ITHERouter.route[](1);
        routes[0] = ITHERouter.route({from: _from, to: _to, stable: false});
        router.swapExactTokensForTokens(_amount, 0, routes, address(this), block.timestamp);
    }


    /// @dev Core harvest function.
    ///      Charges fees based on the amount of BUSD gained from reward
    function _chargeFees() internal returns (uint256 callFeeToUser){
        IERC20Upgradeable THE = IERC20Upgradeable(the);
        IERC20Upgradeable BUSD = IERC20Upgradeable(busd);
        uint256 BUSDBalBefore = BUSD.balanceOf(address(this));
        uint256 toSwap;
        for (uint256 i; i < THEToBUSDPath.length - 1; i++) {
            if (THEToBUSDPath[i] == the) {
                toSwap = (THE.balanceOf(address(this)) * totalFee) / PERCENT_DIVISOR;
            } else {
                toSwap = IERC20Upgradeable(THEToBUSDPath[i]).balanceOf(address(this));
            }
            _swap(THEToBUSDPath[i],THEToBUSDPath[i+1], toSwap);
        }
        uint256 BUSDFee = BUSD.balanceOf(address(this)) - BUSDBalBefore;

        if (BUSDFee != 0) {
            BUSD.safeTransfer(treasury, BUSDFee);
        }
    }

    function _swapToRelay() internal {
        for (uint256 i; i < THEToRelayPath.length - 1; i++) {
            _swap(THEToRelayPath[i], THEToRelayPath[i+1], IERC20Upgradeable(THEToRelayPath[i]).balanceOf(address(this)));
        }
    }

    /// @dev Core harvest function.
    ///      Converts half of held {relay} in {want}
    function _addLiquidity() internal {
        uint256 relayBal = IERC20Upgradeable(relay).balanceOf(address(this));
        if (relayBal == 0) {
            return;
        }

        if (relay == lpToken0) {
            _swap(relay, lpToken1, relayBal / 2);
        } else {
            _swap(relay, lpToken0, relayBal / 2);
        }

        uint256 lpToken0Bal = IERC20Upgradeable(lpToken0).balanceOf(address(this));
        uint256 lpToken1Bal = IERC20Upgradeable(lpToken1).balanceOf(address(this));
        IERC20Upgradeable(lpToken0).safeIncreaseAllowance(THENA_ROUTER, lpToken0Bal);
        IERC20Upgradeable(lpToken1).safeIncreaseAllowance(THENA_ROUTER, lpToken1Bal);
        ITHERouter(THENA_ROUTER).addLiquidity(
            lpToken0,
            lpToken1,
            ITHEPair(want).stable(),
            lpToken0Bal,
            lpToken1Bal,
            0,
            0,
            address(this),
            block.timestamp
        );
    }

    /// @dev Function to calculate the total {want} held by the strat.
    ///      It takes into account both the funds directly held by the contract and those into the {gauge}
    function balanceOf() public view override returns (uint256) {
        return balanceInGauge() + IERC20Upgradeable(want).balanceOf(address(this));
    }

    /// @dev Returns the amount of {want} staked into the {gauge}
    function balanceInGauge() public view returns (uint256) {
        return ITHEGauge(gauge).balanceOf(address(this));
    }


    /// @dev Withdraws all funds leaving rewards behind.
    function _reclaimWant() internal override {
        ITHEGauge(gauge).withdrawAll();
    }

    function setTHEToRelayPath(address[] memory _path) external {
        _atLeastRole(STRATEGIST);
        require(_path[0] == the && _path[_path.length - 1] == relay, "INVALID INPUT");
        THEToRelayPath = _path;
    }

    function setRelay(address _relay) external {
        _atLeastRole(STRATEGIST);
        require(_relay == lpToken0 || _relay == lpToken1, "INVALID INPUT");
        relay = _relay;
    }

    function setTHEToBUSDPath(address[] memory _path) external {
        _atLeastRole(STRATEGIST);
        require(_path[0] == the && _path[_path.length - 1] == busd, "INVALID INPUT");
        THEToBUSDPath = _path;
    }
}
