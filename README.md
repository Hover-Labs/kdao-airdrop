# `kDAO` Airdrop Scripts

Snapshots were taken every every 24 hours between Kolibri Genesis and May 7 [1].

Each address can receive 1 point for each of the following categories, for a maximum of 6 points:
- Borrowed more than 10 kUSD at a snapshot
- Supplied kUSD Liquidity to Dexter
- Supplied kUSD Liquidity to Quipuswap v1.0
- Supplied kUSD Liquidity to Quipuswap v1.1
- Supplied kUSD Liquidity to the Kolibri Liquidity Pool
- Executed a Kolibri governance proposal

Points are redeemable into `kDAO` airdrop tokens. The redemption value of one point is yet to be determined.

## Precomputed Data

The Kolibri team has precomputed outputs. `airdrop-data.csv` contains a list of addresses and points earned. 

For debugging purposes, the following artifacts are also provided:
- `oven-borrowers.csv`: All users who met the borrow requirement.
- `dexter-lps.csv`: All users who supplied liquidity to Dexter
- `quipu-lps-old.csv`: All users who supplied liquidity to Quipuswap v1.0
- `quipu-lps-new.csv`: All users who supplied liquidity to Quipuswap v1.1
- `kolibri-lps.csv`: All users who supplied liquidity to the Kolibri Liquidity Pool
- `governance.csv`: All users who executed a governance proposal.

**If you think this data is incorrect, [please alert the Hover Labs team](https://discord.com/invite/pCKVNTw6Pf) as soon as possible!**

## Running the script

If you'd like to verify the outputs yourself, you can reproduce with:
```
npm i -g ts-node
npm i
ts-node src/main.ts
```

Be advised this process may take several hours to parse the data required from the chain.

-------

[1] Specifically, snapshots are taken every `1440` blocks (1 day, assuming all blocks are priority 0) from `1330056` until `1461096`.