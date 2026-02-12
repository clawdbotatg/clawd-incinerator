# CLAWD Incinerator — Production QA Report #2

**Date:** 2026-02-12  
**Reviewer:** LeftClaw 🦞 — QA Engineer  
**Methodology:** Phase 3 Checklist (BUILD-PHASES.md) + QA.md + Ethereum Wingman Rules  
**Contract:** `0x536453350f2eee2eb8bfee1866baf4fca494a092` (Base)  
**IPFS CID:** `bafybeibesaf7pnkjwnye7zbnvfv7d5i3lkfbd2wspdplpct3ygdjjtgc5m`  
**ENS:** `incinerator.clawdbotatg.eth` → `.limo` gateway  

---

## 🔴 CRITICAL — Must Fix Before Ship

### 1. Header says "Scaffold-ETH" — not the app name
**File:** `components/Header.tsx` line 91  
**Issue:** The header brand text is `Scaffold-ETH`. This is the first thing users see.  
**Rule:** QA.md — "If using the scaffold-eth header, it says the app's name — NOT Scaffold-ETH"  
**Fix:** Change to `🔥 INCINERATOR` or `CLAWD Incinerator`.

### 2. Debug Contracts link still in navigation
**File:** `components/Header.tsx` — `menuLinks` array  
**Issue:** "Debug Contracts" with the bug icon is visible in the nav. This is a developer tool, not a production page.  
**Rule:** Wingman Rule 5 — "Remove Debug Contracts nav link"  
**Fix:** Remove the Debug Contracts entry from `menuLinks`.

### 3. Raw address display instead of `<Address/>`
**File:** `app/incinerator/_components/RecentBurns.tsx` lines 7-12  
**Issue:** Custom `ShortAddress` component renders truncated hex. No ENS resolution, no blockie avatar, no copy-to-clipboard, no block explorer link.  
**Rule:** Wingman Rule 3 — "EVERY time you display an Ethereum address, use `<Address/>`"  
**Fix:** Replace `ShortAddress` with SE2's `<Address address={caller} size="xs" />`.

### 4. Page title and metadata are SE2 defaults
**File:** `app/layout.tsx`  
**Issue:** Title is `"Scaffold-ETH 2 App"`, description is `"Built with 🏗 Scaffold-ETH 2"`. The browser tab, social unfurls, and search results all show the wrong name.  
**Rule:** QA.md — social/SEO check; Wingman Rule 5 pre-publish checklist  
**Fix:**  
```typescript
export const metadata = getMetadata({
  title: '🔥 CLAWD Incinerator',
  description: 'Burn $CLAWD tokens and earn a reward. Call incinerate() every 8 hours on Base.'
});
```

### 5. OG image is stock SE2 thumbnail
**File:** `public/thumbnail.jpg`  
**Issue:** Still the default Scaffold-ETH 2 thumbnail. Twitter/Telegram/Discord unfurls will show generic SE2 branding instead of the incinerator.  
**Rule:** QA.md — "App has a Twitter/Open Graph unfurl card image"; Wingman Rule 5 — "Custom OG image (1200x630 PNG) — NOT the stock SE2 thumbnail"  
**Fix:** Generate a branded 1200×630 image with fire theme, app name, and Base logo. Replace `public/thumbnail.jpg`.

### 6. OG image URL points to localhost
**File:** `utils/scaffold-eth/getMetadata.ts`  
**Issue:** `baseUrl` falls back to `localhost:3000` since there's no `VERCEL_PROJECT_PRODUCTION_URL` on IPFS. All og:image URLs are `http://localhost:3000/thumbnail.jpg`.  
**Rule:** Wingman Rule 5 — "OG image URL MUST be absolute URL starting with https://"  
**Fix:** Add `NEXT_PUBLIC_PRODUCTION_URL` support in getMetadata.ts and set it to `https://incinerator.clawdbotatg.eth.limo` during the IPFS build.

---

## 🟡 MEDIUM — Should Fix

### 7. Duplicate page content — `page.tsx` and `incinerator/page.tsx` are identical
**Files:** `app/page.tsx` and `app/incinerator/page.tsx`  
**Issue:** Both render the exact same IncineratorPanel + RecentBurns. The `/incinerator` route is unnecessary since the root page IS the incinerator. Two routes serving identical content is confusing.  
**Fix:** Delete `app/incinerator/page.tsx` (or make root redirect to it). Keep one canonical URL.

### 8. Title "INCINERATOR" duplicated — header AND page body
**File:** `app/page.tsx` (and `app/incinerator/page.tsx`)  
**Issue:** After fixing the header to say "INCINERATOR", the `<h1>🔥 INCINERATOR 🔥</h1>` in the page body becomes a duplicate.  
**Rule:** Wingman Rule 3d — "DO NOT put the app name as an h1 at the top of the page body. The header already displays the app name."  
**Fix:** Remove the h1 from the page, or change the header to something shorter ("🔥 Incinerator") and keep the hero as the main visual element. Since this is a single-purpose dark-themed app, the hero title could stay if the header title is simplified to just a logo/icon.

### 9. Event history scans from block 0
**File:** `app/incinerator/_components/RecentBurns.tsx` line 19  
**Issue:** `fromBlock: BigInt(0)` scans all Base blocks from genesis. This will get progressively slower and may hit RPC limits.  
**Fix:** Set `fromBlock` to the contract deployment block or a recent block before first burn.

### 10. Footer "Fork me" links to scaffold-eth/se-2
**File:** `components/Footer.tsx` line 50  
**Issue:** Footer says "Fork me" and links to `https://github.com/scaffold-eth/se-2` instead of the actual project repo.  
**Rule:** Wingman Rule 5 — "Footer 'Fork me' link → your actual repo"  
**Fix:** Change to `https://github.com/clawdbotatg/clawd-incinerator`.

### 11. README is stock SE2 boilerplate
**File:** `README.md`  
**Issue:** Default Scaffold-ETH 2 readme. Doesn't describe the incinerator at all.  
**Rule:** Wingman Rule 5 — "README updated from SE2 default"  
**Fix:** Write a project-specific README covering what it does, how to call incinerate(), contract address, and the ENS URL.

### 12. manifest.json still says "Scaffold-ETH 2 DApp"
**File:** `public/manifest.json`  
**Issue:** PWA manifest name/description are SE2 defaults.  
**Fix:** Update to "CLAWD Incinerator" with proper description.

### 13. Theme switcher present but app is hardcoded dark
**Issue:** The app uses `bg-black`, `bg-zinc-900`, `text-white` everywhere — it's designed as a dark-only experience. But the SE2 theme switcher is still in the footer, and switching to light theme would create a white header/footer with black content — broken visual.  
**Rule:** QA.md — "App properly supports light AND dark themes, OR the theme switcher is removed and a default theme is hardcoded"  
**Fix:** Either remove the theme switcher and force dark mode, or make the app properly support both themes. Recommendation: remove switcher, force dark.

### 14. No USD value context for token amounts
**Issue:** "Burns 10M $CLAWD" and "Earns 10K $CLAWD" — user has no idea what these are worth in dollars.  
**Rule:** Wingman Rule 3c — "EVERY token or ETH amount displayed should include its USD value"  
**Fix:** Add DexScreener price lookup for $CLAWD and show approximate USD values. Lower priority for a meme token, but still a UX gap.

---

## 🟢 PASSING

| Check | Status | Notes |
|-------|--------|-------|
| Contract uses SafeERC20 | ✅ | `using SafeERC20 for IERC20` |
| Contract access control (Ownable) | ✅ | `setParameters()` and `emergencyWithdraw()` are onlyOwner |
| Events emitted on state changes | ✅ | `Incinerated` and `ParametersUpdated` |
| Checks-Effects-Interactions pattern | ✅ | State updated before transfers |
| Incentive design (who calls and why) | ✅ | Caller gets 10K CLAWD reward |
| No infinite approvals | ✅ | No approve pattern needed — contract holds tokens |
| Scaffold hooks only (no raw wagmi) | ✅ | `useScaffoldReadContract`, `useScaffoldWriteContract` throughout |
| Incinerate button has loader + disable | ✅ | `isIncinerating` state, "🔥 Burning..." text, disabled while pending |
| Network switch button (three-button flow) | ✅ | Wrong network → "Switch to {network}" |
| No approve step needed (correct) | ✅ | Contract holds its own tokens, no user approval needed |
| Error handling with human messages | ✅ | Cooldown, empty contract, and generic errors caught with notifications |
| RPC override to Alchemy | ✅ | `scaffold.config.ts` has Base → Alchemy |
| Polling interval 3000ms | ✅ | Set correctly |
| `onlyLocalBurnerWallet: true` | ✅ | Correctly set |
| `targetNetworks: [chains.base]` | ✅ | Production chain set |
| IPFS config (output export, trailingSlash, assetPrefix) | ✅ | All three set in next.config.ts |
| Node 25 localStorage polyfill | ✅ | Present in next.config.ts |
| Contract deployed to live Base network | ✅ | Verified at `0x5364...a092` |
| Countdown timer works | ✅ | Client-side countdown with proper formatting |
| No hardcoded localhost in frontend code | ✅ | All contract reads via scaffold hooks |
| Wallet connect flow works | ✅ | RainbowKit pre-configured |
| BigInt formatting (formatEther) | ✅ | Proper M/K formatting |

---

## 📋 Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 6 | Header name, Debug link, raw addresses, metadata, OG image, OG URL |
| 🟡 Medium | 8 | Duplicate pages, duplicate title, block 0 scan, footer link, README, manifest, theme, USD values |
| 🟢 Passing | 22 | Contract, hooks, UX flow, config, IPFS setup |

**Verdict: NOT production-ready.** The 6 critical issues are all "stock SE2 branding left in place" problems — easy to fix but embarrassing if shipped. The contract is solid. The core UX flow (connect → switch → incinerate) works correctly. This needs a branding/polish pass before it's ship-quality.

### Recommended Fix Order
1. Header name + remove Debug Contracts (2 min)
2. Layout metadata title/description (1 min)
3. Replace `ShortAddress` with `<Address/>` (2 min)
4. Footer repo link + manifest.json (1 min)
5. Remove theme switcher, force dark mode (5 min)
6. Remove duplicate `/incinerator` route (1 min)
7. Set `fromBlock` to deployment block (1 min)
8. Generate OG image + fix getMetadata.ts for production URL (10 min)
9. Write project README (5 min)
10. Add USD price context (15 min, optional)

**Estimated total fix time: ~30 minutes for all critical + medium issues.**
