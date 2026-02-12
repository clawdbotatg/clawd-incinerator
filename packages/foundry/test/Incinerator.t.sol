// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/Incinerator.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockCLAWD is ERC20 {
    constructor() ERC20("CLAWD", "CLAWD") {
        _mint(msg.sender, 1_000_000_000 ether);
    }
}

contract IncineratorTest is Test {
    Incinerator public incinerator;
    MockCLAWD public clawd;
    address public caller = address(0xBEEF);
    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;

    uint256 constant BURN_AMOUNT = 10_000_000 ether;
    uint256 constant CALLER_REWARD = 10_000 ether;
    uint256 constant COOLDOWN = 8 hours;

    function setUp() public {
        clawd = new MockCLAWD();
        incinerator = new Incinerator(
            address(clawd),
            BURN_AMOUNT,
            CALLER_REWARD,
            COOLDOWN
        );
        // Fund the incinerator with tokens
        clawd.transfer(address(incinerator), 100_000_000 ether);
    }

    function testIncinerate() public {
        vm.prank(caller);
        incinerator.incinerate();

        assertEq(incinerator.totalBurned(), BURN_AMOUNT);
        assertEq(incinerator.totalCalls(), 1);
        assertEq(clawd.balanceOf(DEAD), BURN_AMOUNT);
        assertEq(clawd.balanceOf(caller), CALLER_REWARD);
        assertEq(incinerator.callerBurnCount(caller), 1);
    }

    function testCooldownEnforced() public {
        vm.prank(caller);
        incinerator.incinerate();

        vm.prank(caller);
        vm.expectRevert("Cooldown not elapsed");
        incinerator.incinerate();
    }

    function testCanCallAfterCooldown() public {
        vm.prank(caller);
        incinerator.incinerate();

        vm.warp(block.timestamp + COOLDOWN);

        vm.prank(caller);
        incinerator.incinerate();

        assertEq(incinerator.totalCalls(), 2);
        assertEq(clawd.balanceOf(caller), CALLER_REWARD * 2);
    }

    function testTimeUntilNextBurn() public {
        assertEq(incinerator.timeUntilNextBurn(), 0); // Can burn immediately

        vm.prank(caller);
        incinerator.incinerate();

        assertGt(incinerator.timeUntilNextBurn(), 0);

        vm.warp(block.timestamp + COOLDOWN);
        assertEq(incinerator.timeUntilNextBurn(), 0);
    }

    function testCanIncinerate() public {
        assertTrue(incinerator.canIncinerate());

        vm.prank(caller);
        incinerator.incinerate();

        assertFalse(incinerator.canIncinerate()); // cooldown
        vm.warp(block.timestamp + COOLDOWN);
        assertTrue(incinerator.canIncinerate());
    }

    function testNotEnoughTokens() public {
        // Deploy with empty contract
        Incinerator empty = new Incinerator(
            address(clawd), BURN_AMOUNT, CALLER_REWARD, COOLDOWN
        );

        vm.prank(caller);
        vm.expectRevert("Not enough CLAWD in contract");
        empty.incinerate();
    }

    function testDifferentCallersGetReward() public {
        address caller2 = address(0xCAFE);

        vm.prank(caller);
        incinerator.incinerate();

        vm.warp(block.timestamp + COOLDOWN);

        vm.prank(caller2);
        incinerator.incinerate();

        assertEq(clawd.balanceOf(caller), CALLER_REWARD);
        assertEq(clawd.balanceOf(caller2), CALLER_REWARD);
        assertEq(incinerator.callerBurnCount(caller), 1);
        assertEq(incinerator.callerBurnCount(caller2), 1);
    }

    function testOwnerCanSetParameters() public {
        incinerator.setParameters(5_000_000 ether, 5_000 ether, 4 hours);

        assertEq(incinerator.burnAmount(), 5_000_000 ether);
        assertEq(incinerator.callerReward(), 5_000 ether);
        assertEq(incinerator.cooldownSeconds(), 4 hours);
    }

    function testNonOwnerCannotSetParameters() public {
        vm.prank(caller);
        vm.expectRevert();
        incinerator.setParameters(1, 1, 1);
    }

    function testEmergencyWithdraw() public {
        uint256 balance = clawd.balanceOf(address(incinerator));
        incinerator.emergencyWithdraw(address(clawd), balance);
        assertEq(clawd.balanceOf(address(this)), clawd.totalSupply() - balance + balance);
    }

    function testEmitEvent() public {
        vm.prank(caller);
        vm.expectEmit(true, false, false, true);
        emit Incinerator.Incinerated(caller, BURN_AMOUNT, CALLER_REWARD, block.timestamp);
        incinerator.incinerate();
    }
}
