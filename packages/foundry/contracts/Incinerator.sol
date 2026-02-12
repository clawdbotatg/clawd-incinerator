// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Incinerator 🔥
/// @notice A public CLAWD token burner. Anyone can call incinerate() once every cooldown period.
/// Each call burns a set amount of CLAWD and rewards the caller.
/// @dev The contract must hold CLAWD tokens. Owner can configure parameters.
contract Incinerator is Ownable {
    using SafeERC20 for IERC20;

    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;

    IERC20 public immutable CLAWD_TOKEN;

    uint256 public burnAmount;       // Amount burned per call (e.g. 10M CLAWD)
    uint256 public callerReward;     // Reward to caller per call (e.g. 10k CLAWD)
    uint256 public cooldownSeconds;  // Time between calls (e.g. 8 hours)

    uint256 public lastIncinerateTime;
    uint256 public totalBurned;
    uint256 public totalCalls;

    // Track callers
    mapping(address => uint256) public callerBurnCount;
    mapping(address => uint256) public callerTotalBurned;

    event Incinerated(
        address indexed caller,
        uint256 amountBurned,
        uint256 callerRewardPaid,
        uint256 timestamp
    );

    event ParametersUpdated(
        uint256 burnAmount,
        uint256 callerReward,
        uint256 cooldownSeconds
    );

    constructor(
        address _clawdToken,
        uint256 _burnAmount,
        uint256 _callerReward,
        uint256 _cooldownSeconds
    ) Ownable(msg.sender) {
        CLAWD_TOKEN = IERC20(_clawdToken);
        burnAmount = _burnAmount;
        callerReward = _callerReward;
        cooldownSeconds = _cooldownSeconds;
        // Allow first call immediately
        // We don't set lastIncinerateTime, so it defaults to 0
        // The check uses a special case for first call
    }

    /// @notice Burn CLAWD tokens and reward the caller. Anyone can call this.
    function incinerate() external {
        require(
            totalCalls == 0 || block.timestamp >= lastIncinerateTime + cooldownSeconds,
            "Cooldown not elapsed"
        );

        uint256 contractBalance = CLAWD_TOKEN.balanceOf(address(this));
        uint256 totalNeeded = burnAmount + callerReward;
        require(contractBalance >= totalNeeded, "Not enough CLAWD in contract");

        lastIncinerateTime = block.timestamp;
        totalBurned += burnAmount;
        totalCalls += 1;
        callerBurnCount[msg.sender] += 1;
        callerTotalBurned[msg.sender] += burnAmount;

        // Burn tokens by sending to dead address
        CLAWD_TOKEN.safeTransfer(DEAD, burnAmount);

        // Reward the caller
        CLAWD_TOKEN.safeTransfer(msg.sender, callerReward);

        emit Incinerated(msg.sender, burnAmount, callerReward, block.timestamp);
    }

    /// @notice Time remaining until next incineration is possible
    function timeUntilNextBurn() external view returns (uint256) {
        if (totalCalls == 0) return 0; // First call always allowed
        if (block.timestamp >= lastIncinerateTime + cooldownSeconds) {
            return 0;
        }
        return (lastIncinerateTime + cooldownSeconds) - block.timestamp;
    }

    /// @notice Check if incinerate() can be called right now
    function canIncinerate() external view returns (bool) {
        if (totalCalls > 0 && block.timestamp < lastIncinerateTime + cooldownSeconds) return false;
        uint256 contractBalance = CLAWD_TOKEN.balanceOf(address(this));
        return contractBalance >= burnAmount + callerReward;
    }

    /// @notice CLAWD balance held by this contract
    function clawdBalance() external view returns (uint256) {
        return CLAWD_TOKEN.balanceOf(address(this));
    }

    /// @notice Owner can update parameters
    function setParameters(
        uint256 _burnAmount,
        uint256 _callerReward,
        uint256 _cooldownSeconds
    ) external onlyOwner {
        burnAmount = _burnAmount;
        callerReward = _callerReward;
        cooldownSeconds = _cooldownSeconds;
        emit ParametersUpdated(_burnAmount, _callerReward, _cooldownSeconds);
    }

    /// @notice Owner can withdraw tokens in case of emergency
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
