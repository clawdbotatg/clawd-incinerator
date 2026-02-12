# Ethereum Wingman QA Report — CLAWD Incinerator

**Date:** 2026-02-12
**Reviewer:** LeftClaw 🦞 (via ethereum-wingman skill)
**Contract:** `0x536453350f2eee2eb8bfee1866baf4fca494a092` (Base)
**IPFS CID:** `bafybeibesaf7pnkjwnye7zbnvfv7d5i3lkfbd2wspdplpct3ygdjjtgc5m`

---

## Contract Review ✅

| Check | Status | Notes |
|-------|--------|-------|
| SafeERC20 | ✅ | `using SafeERC20 for IERC20` — handles non-standard tokens |
| Access control | ✅ | `Ownable` on `setParameters()` and `emergencyWithdraw()` |
| Events emitted | ✅ | `Incinerated` and `ParametersUpdated` events |
| Incentive design | ✅ | Caller gets 10K $CLAWD reward — answers "who calls and why?" |
| No infinite approvals | ✅ | No approve pattern needed — contract holds tokens directly |
| Checks-Effects-Interactions | ✅ | State updated before external `safeTransfer` calls |
| Reentrancy | ✅ | CEI pattern sufficient here (no ETH transfers, SafeERC20) |
| Input validation | ✅ | Cooldown check, balance check before transfers |
| Token decimals | ✅ | Uses raw amounts set at deploy — no decimal math needed |
| No floating point | ✅ | No percentage calculations in contract |

**Contract is solid. No issues found.**

---

## Frontend Review

### 🔴 Critical Issues

#### 1. Raw address display instead of `<Address/>` (Rule 3)

**File:** `app/incinerator/_components/RecentBurns.tsx`

Custom `ShortAddress` component renders truncated hex:
```typescript
function ShortAddress({ address }: { address: string }) {
  return (
    <span className="font-mono text-xs text-zinc-300">
      {address.slice(0, 6)}...{address.slice(-4)}
    </span>
  );
}
```

**Should use:** SE2's `<Address/>` component which provides ENS resolution, blockie avatars, copy-to-clipboard, and block explorer links. Raw hex is unacceptable per wingman rules.

**Fix:**
```typescript
import { Address } from "~~/components/scaffold-eth";
// Replace <ShortAddress address={caller} /> with:
<Address address={caller} size="xs" />
```

---

### 🟡 Medium Issues

#### 2. Page title/meta still SE2 defaults (Rule 5)

**File:** `app/layout.tsx`

```typescript
export const metadata = getMetadata({
  title: 'Scaffold-ETH 2 App',
  description: 'Built with 🏗 Scaffold-ETH 2'
});
```

Should be:
```typescript
export const metadata = getMetadata({
  title: '🔥 CLAWD Incinerator',
  description: 'Burn $CLAWD tokens and earn a reward. Call incinerate() every 8 hours on Base.'
});
```

#### 3. No custom OG image (Rule 5)

Still using SE2's default `thumbnail.png`. Social unfurls (Twitter, Telegram, Discord) will show the generic SE2 image instead of something branded for the incinerator.

**Fix:** Generate a 1200x630 PNG with incinerator branding, replace `public/thumbnail.png`.

#### 4. No USD values shown (Rule 3c)

Token amounts display as "10M $CLAWD" with no dollar context. Users don't know what 10M CLAWD is worth.

**Mitigation:** For a meme token, this is lower priority. Could add a DexScreener price lookup:
```
https://api.dexscreener.com/latest/dex/tokens/0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07
```

#### 5. Event history scans from genesis block

**File:** `app/incinerator/_components/RecentBurns.tsx`

```typescript
fromBlock: BigInt(0),
```

This scans from block 0 on Base. Will get progressively slower as more blocks are produced. Should use a block near contract deployment.

**Fix:** Set `fromBlock` to the contract deployment block (or a recent block).

---

### 🟢 Passed Checks

| Rule | Status | Notes |
|------|--------|-------|
| Loader + disable on onchain button (Rule 1) | ✅ | `isIncinerating` state, button shows "🔥 Burning...", disabled while pending |
| Three-button flow (Rule 2) | ✅ | Wrong network → "Switch to Base" / Connected → "Incinerate" (no approve needed) |
| Scaffold hooks only (no raw wagmi) | ✅ | Uses `useScaffoldReadContract`, `useScaffoldWriteContract` throughout |
| RPC configured to Alchemy (Rule 4) | ✅ | `scaffold.config.ts` has Alchemy override for Base |
| Polling interval 3000ms (Rule 4) | ✅ | Set in `scaffold.config.ts` |
| `onlyLocalBurnerWallet: true` | ✅ | Correctly set |
| Error handling | ✅ | Catches errors, shows notifications for cooldown/empty/unknown |
| No shared `isLoading` state | ✅ | Only one onchain button, has its own `isIncinerating` |
| Separate loading states per button | ✅ | N/A — single action button |

---

## Duplicate Title Check (Rule 3d)

`page.tsx` has `<h1>🔥 INCINERATOR 🔥</h1>`. The SE2 header also shows the app name. However, since this is a single-purpose IPFS app with a dark theme, the hero title is the main visual — the header title should probably be simplified or this is acceptable as the primary heading.

**Verdict:** Minor — the page.tsx h1 IS the main UI, not a redundant duplicate. The header app name should match though.

---

## Summary

| Severity | Count | Items |
|----------|-------|-------|
| 🔴 Critical | 1 | Raw address display (use `<Address/>`) |
| 🟡 Medium | 4 | Default meta, no OG image, no USD values, genesis block scan |
| 🟢 Passing | 10 | All other wingman rules pass |

**Overall: Ship-quality contract, frontend needs minor polish before being production-proud.**
