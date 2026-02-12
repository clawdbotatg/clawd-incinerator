# Security Audit Report — clawd-incinerator

**Date:** February 12, 2026  
**Auditor:** Clawd (Automated Security Review)  
**Scope:** `packages/foundry/contracts/Incinerator.sol`, `packages/foundry/contracts/YourContract.sol`  
**Solidity:** ^0.8.20 / >=0.8.0 <0.9.0  
**Framework:** Foundry + OpenZeppelin  

---

## Executive Summary

The primary contract under review is **Incinerator.sol** — a public CLAWD token burner that allows anyone to trigger periodic burns in exchange for a small reward. The contract is well-structured, uses battle-tested OpenZeppelin libraries, and has no critical vulnerabilities. Several low-severity findings and gas optimizations are noted below.

**YourContract.sol** is a Scaffold-ETH template/placeholder and is not production code. It is reviewed briefly for completeness.

### Severity Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High     | 0 |
| Medium   | 1 |
| Low      | 3 |
| Informational | 4 |
| Gas Optimizations | 3 |

---

## Contract: Incinerator.sol

### Overview

- Burns a configurable `burnAmount` of CLAWD tokens by sending them to the `0x...dEaD` address
- Rewards the caller with `callerReward` tokens per successful call
- Enforces a `cooldownSeconds` delay between burns
- Owner can update parameters and perform emergency withdrawals
- Uses OpenZeppelin `SafeERC20`, `Ownable`, and `IERC20`

### Architecture Assessment

The contract follows a clean, minimal design. State changes occur before external calls (checks-effects-interactions pattern). SafeERC20 handles non-standard ERC20 return values. The immutable token address prevents post-deployment changes to the target token.

**Rating: Good**

---

### Findings

#### [M-01] Owner can set `callerReward` to drain the entire contract balance

**Severity:** Medium  
**Location:** `setParameters()`

The owner can set `callerReward` to an arbitrarily large value (e.g., the full contract balance minus 1 wei for `burnAmount`). While `onlyOwner` restricts this, it means the owner can effectively extract all tokens through a single `incinerate()` call or by directly setting parameters and calling from their own address.

This is an inherent centralization risk. If the owner key is compromised, all held tokens can be drained instantly via `setParameters` + `incinerate` or `emergencyWithdraw`.

**Recommendation:** Consider:
- Adding upper bounds on `callerReward` relative to `burnAmount` (e.g., reward ≤ 1% of burn)
- Using a timelock or multisig for parameter changes
- Emitting events is already done — good

#### [L-01] No zero-value validation in `setParameters()`

**Severity:** Low  
**Location:** `setParameters()`

Owner can set `burnAmount = 0`, which would allow callers to extract `callerReward` tokens without any burning occurring. Similarly, `cooldownSeconds = 0` allows rapid-fire calls that drain the contract.

**Recommendation:** Add minimum value checks:
```solidity
require(_burnAmount > 0, "Burn amount must be > 0");
require(_cooldownSeconds > 0, "Cooldown must be > 0");
```

#### [L-02] No zero-address validation in constructor for `_clawdToken`

**Severity:** Low  
**Location:** `constructor()`

If `address(0)` is passed as `_clawdToken`, the contract is permanently bricked (immutable). SafeERC20 calls would revert on every interaction, but the contract would be deployed with no way to fix it.

**Recommendation:**
```solidity
require(_clawdToken != address(0), "Invalid token address");
```

#### [L-03] `emergencyWithdraw` can withdraw CLAWD tokens, breaking accounting

**Severity:** Low  
**Location:** `emergencyWithdraw()`

If the owner withdraws CLAWD via `emergencyWithdraw`, the `totalBurned` counter becomes inconsistent with actual tokens sent to the dead address. This is cosmetic/off-chain only and doesn't affect contract security, but may confuse frontends.

**Recommendation:** Acceptable as-is for an emergency function. Document that `totalBurned` only tracks `incinerate()` calls.

#### [I-01] Burn mechanism uses dead address, not ERC20 `burn()`

**Severity:** Informational

Sending tokens to `0x...dEaD` is a common pattern but does not reduce `totalSupply()`. If the CLAWD token has a `burn()` function, using it would reduce circulating supply more accurately. The dead address approach works but tokens remain in `totalSupply`.

**Recommendation:** If CLAWD supports `IERC20Burnable`, consider using `burn()` instead. If not, the dead address approach is fine.

#### [I-02] `lastIncinerateTime + cooldownSeconds` could overflow in extreme scenarios

**Severity:** Informational

With Solidity ^0.8.20, arithmetic is checked by default, so overflow would revert safely. However, if `cooldownSeconds` is set to `type(uint256).max`, the addition would overflow and permanently lock the function. This is a non-realistic owner-only misconfiguration.

**Recommendation:** No action needed; checked arithmetic handles this safely.

#### [I-03] No event emitted on `emergencyWithdraw`

**Severity:** Informational

Emergency withdrawals are not logged via events, making off-chain monitoring harder.

**Recommendation:**
```solidity
event EmergencyWithdraw(address indexed token, uint256 amount);
```

#### [I-04] `console.sol` import in YourContract.sol

**Severity:** Informational

The `forge-std/console.sol` import in `YourContract.sol` should be removed before any production deployment. It increases deployment gas and is a debug-only dependency.

---

### Security Properties Verified

| Property | Status | Notes |
|----------|--------|-------|
| **Reentrancy** | ✅ Safe | State updated before external calls; SafeERC20 used |
| **Access Control** | ✅ Good | OpenZeppelin Ownable; owner-only admin functions |
| **Integer Overflow/Underflow** | ✅ Safe | Solidity ^0.8.20 has built-in checks |
| **Cooldown Enforcement** | ✅ Correct | First-call special case is clean; subsequent calls properly gated |
| **ERC20 Interactions** | ✅ Safe | SafeERC20 handles non-standard tokens |
| **Token Burn Mechanism** | ✅ Functional | Dead address pattern; tokens irrecoverable |
| **Front-running** | ⚠️ Minor | Callers may race to call `incinerate()` after cooldown; MEV bots could extract the reward. This is by design and acceptable. |
| **Denial of Service** | ✅ Safe | No unbounded loops; no user-controlled array iteration |

---

### Gas Optimizations

#### [G-01] Cache `burnAmount` and `callerReward` in `incinerate()`

Reading storage variables multiple times costs extra gas. Cache them in memory:

```solidity
function incinerate() external {
    uint256 _burnAmount = burnAmount;
    uint256 _callerReward = callerReward;
    uint256 totalNeeded = _burnAmount + _callerReward;
    // ... use _burnAmount and _callerReward throughout
}
```

**Savings:** ~200 gas per call (2 SLOAD avoided)

#### [G-02] Use `unchecked` for counter increments

`totalCalls`, `callerBurnCount`, and `callerTotalBurned` will never realistically overflow:

```solidity
unchecked {
    totalCalls += 1;
    callerBurnCount[msg.sender] += 1;
    callerTotalBurned[msg.sender] += burnAmount;
}
```

**Savings:** ~60-90 gas per call

#### [G-03] Use `++totalCalls` instead of `totalCalls += 1`

Pre-increment is marginally cheaper.

**Savings:** ~5 gas per call

---

## Contract: YourContract.sol

### Overview

This is a Scaffold-ETH boilerplate contract. It is **not production code** and should either be removed or replaced before deployment.

### Notable Issues

- **`console.sol` import** — Must be removed for production
- **Custom `isOwner` modifier** instead of OpenZeppelin `Ownable` — functional but less battle-tested
- **`withdraw()` uses low-level `.call{}`** — correct pattern for ETH transfer, but the contract has no meaningful purpose
- **`premium` state** is naive — any ETH sent marks `premium = true`, replaced to `false` on next free call

**Recommendation:** Remove this file before production deployment or replace with actual functionality.

---

## Recommendations Summary

1. **Add input validation** to `setParameters()` — enforce minimums for `burnAmount` and `cooldownSeconds` [L-01]
2. **Add zero-address check** in constructor for `_clawdToken` [L-02]
3. **Consider a timelock** for parameter changes to reduce centralization risk [M-01]
4. **Add an event** for `emergencyWithdraw` [I-03]
5. **Remove YourContract.sol** or the `console.sol` import before production [I-04]
6. **Apply gas optimizations** — storage caching and unchecked increments [G-01, G-02]
7. **Consider using `burn()`** instead of dead address if the CLAWD token supports it [I-01]

---

## Conclusion

**Incinerator.sol is well-written and production-ready** with minor improvements recommended. The contract correctly implements the checks-effects-interactions pattern, uses SafeERC20 for safe token transfers, and has proper access controls via OpenZeppelin's Ownable. No critical or high-severity vulnerabilities were found.

The primary risk is centralization — the owner has full control over parameters and emergency withdrawals. This is acceptable for a team-controlled deployment but should be mitigated with a multisig or timelock for higher trust requirements.

---

*This audit is a best-effort review and does not constitute a guarantee of security. A formal audit by a dedicated security firm is recommended for contracts holding significant value.*
