// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVeloPair {
    function claimFees() external returns (uint256 claimed0, uint256 claimed1);

    function claimable0(address) external view returns (uint256);

    function claimable1(address) external view returns (uint256);

    function stable() external view returns (bool);

    function tokens() external view returns (address, address);
}