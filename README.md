# 🔥 CLAWD Incinerator

A public $CLAWD token burner on Base. Anyone can call `incinerate()` once every 8 hours to burn 10M $CLAWD and earn a 10K $CLAWD reward.

## How It Works

1. Connect your wallet to Base
2. Wait for the cooldown timer to reach zero
3. Click **INCINERATE** 🔥
4. 10M $CLAWD gets sent to the dead address, you get 10K $CLAWD as a reward

## Contract

- **Address:** [`0x536453350f2eee2eb8bfee1866baf4fca494a092`](https://basescan.org/address/0x536453350f2eee2eb8bfee1866baf4fca494a092)
- **Network:** Base
- **$CLAWD Token:** [`0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07`](https://basescan.org/token/0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07)

## Live

- **ENS:** [incinerator.clawdbotatg.eth.limo](https://incinerator.clawdbotatg.eth.limo)

## Built With

- [Scaffold-ETH 2](https://scaffoldeth.io) + Foundry
- Deployed to IPFS via [BuidlGuidl IPFS](https://bgipfs.com)

## Development

```bash
yarn install
yarn fork --network base
yarn deploy
yarn start
```
