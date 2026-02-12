# CLAWD Incinerator — QA Report #3 (Full Audit)

**Date:** 2026-02-12  
**Reviewer:** LeftClaw 🦞  
**Against:** QA.md + BUILD-PHASES.md Phase 3 + Ethereum Wingman Rules  
**Contract:** `0x536453350f2eee2eb8bfee1866baf4fca494a092` (Base)

---

## Infrastructure

| Check | Status | Notes |
|-------|--------|-------|
| App live on public URL | ✅ | IPFS via ENS → `.eth.limo` |
| Contract on live network | ✅ | Base mainnet |
| Contract verified on block explorer | 🔴 | **NOT verified on Basescan** |

---

## Branding — Zero Scaffold-ETH Leftovers

| Check | Status | Notes |
|-------|--------|-------|
| No SE2 text anywhere | 🔴 | `blockexplorer/layout.tsx` and `debug/page.tsx` still have "Scaffold-ETH 2" in descriptions |
| No SE2 images/logos | 🔴 | `public/logo.svg` is still the SE2 logo (unused in header now but still served) |
| No stock BuidlGuidl footer | 🔴 | Footer still has "Built with ❤️ at BuidlGuidl · Support" with BuidlGuidlLogo |
| App looks good | ✅ | Dark theme, fire branding, clean |
| Header says app name | ✅ | "🔥 Incinerator — CLAWD Token Burner" |
| No duplicate title | 🟡 | Header says "Incinerator", page has `<h1>🔥 INCINERATOR 🔥</h1>` — borderline since hero is the main visual, but technically duplicate |

---

## Contract Visibility

| Check | Status | Notes |
|-------|--------|-------|
| `<Address/>` linking to contract on block explorer | 🔴 | **Missing.** No contract address displayed anywhere on the page |

---

## Theming

| Check | Status | Notes |
|-------|--------|-------|
| Theme properly handled | ✅ | Theme switcher removed, dark mode forced |

---

## Wallet & User Journey

| Check | Status | Notes |
|-------|--------|-------|
| Wallet connects | ✅ | RainbowKit connect button works |
| Wrong network prompt | ✅ | "Switch to Base" button shows |
| Full journey works | ✅ | Connect → switch → incinerate flow works (no tokens loaded yet) |

---

## Social / SEO

| Check | Status | Notes |
|-------|--------|-------|
| OG image generated | ✅ | Custom 1200×630 thumbnail |
| Absolute path in metadata | ✅ | Points to `incinerator.clawdbotatg.eth.limo` |

---

## Summary of Required Fixes

### 🔴 Must Fix (5 items)

1. **Footer** — Remove entire BuidlGuidl "Built with ❤️" section + Support link. Replace with minimal footer (just "Fork me" link or contract address)
2. **Contract `<Address/>`** — Add contract address display at bottom of page linking to Basescan
3. **`public/logo.svg`** — Delete or replace the SE2 logo file
4. **SE2 text in debug/blockexplorer** — Remove or rename these routes (they're dev-only, shouldn't ship)
5. **Contract verification** — Verify on Basescan

### 🟡 Nice to Have (1 item)

6. **Duplicate title** — Header "Incinerator" + page h1 "INCINERATOR" — consider removing one

---

**Estimated fix time: ~15 minutes**
