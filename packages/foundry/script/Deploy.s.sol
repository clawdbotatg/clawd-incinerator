//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import { DeployIncinerator } from "./DeployIncinerator.s.sol";

contract DeployScript is ScaffoldETHDeploy {
  function run() external {
    DeployIncinerator deployIncinerator = new DeployIncinerator();
    deployIncinerator.run();
  }
}