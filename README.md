# Decentralized Voting Dapp (Election + BAL reward)

This repository now includes:
- A Solidity election smart contract with admin operations.
- Merkle-tree voter book verification.
- Future election scheduling (`start`/`end`) and active-time voting guard.
- Direct candidate voting or auto-selection by 3-question position matching.
- Sorted final ranking and winner retrieval.
- Automatic BAL ("Rotem") ERC20 mint reward for each valid vote.
- A basic admin GUI (`frontend/index.html`) for contract operations.

## Contracts

- `contracts/BALToken.sol` – ERC20 token (`Rotem` / `BAL`) minted by the election contract.
- `contracts/ElectionDapp.sol` – Main election logic.

## Admin GUI

Open `frontend/index.html` in a browser with MetaMask and provide your deployed `ElectionDapp` contract address.

Admin actions in GUI:
1. Add candidates (name + 3 positions).
2. Set voter Merkle root.
3. Set election time window (`start`, `end`) in future timestamps.
4. Read final sorted ranking after election ends.

## Build & test

```bash
npm install
npm run build
npm test
```
