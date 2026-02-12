// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import "../contracts/Incinerator.sol";

contract DeployIncinerator is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        // CLAWD token on Base
        address clawdToken = 0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07;

        // PRODUCTION values
        uint256 burnAmount = 10_000_000e18;    // 10M CLAWD per burn
        uint256 callerReward = 10_000e18;      // 10K CLAWD reward
        uint256 cooldownSeconds = 28800;        // 8 hours

        new Incinerator(clawdToken, burnAmount, callerReward, cooldownSeconds);
    }
}
