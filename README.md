# P2Pass

P2Pass is a backendless event, admission, attendance, and reputation protocol for Base Sepolia.

The application uses a wallet as identity and keeps authoritative state on-chain. Event images and avatars may live on IPFS; only their URI is stored by the contracts.

## Architecture

```text
web/                         Next.js, TypeScript, Tailwind, Motion, wagmi + viem
  src/app/                   Public discovery and product routes
  src/components/            Pass, event, transaction, QR, and organizer UI
  src/lib/contracts.ts       Minimal typed contract ABIs and addresses

contracts/
  src/P2PassCore.sol         Events, escrow, refunds, scanner roles, attendance
  src/EventPass.sol          Soulbound ERC-1155 event passes
  src/P2PassReputation.sol   Profiles, peer reviews, event reviews
  test/P2Pass.t.sol          Security and lifecycle tests
  script/Deploy.s.sol        Base Sepolia deployment
```

There is no API server, database, privileged indexer, proxy, or upgrade layer. Public registry data is read directly through the configured Base Sepolia RPC endpoint.

## Base Sepolia deployment

The current frontend configuration points to the live deployment from 18 August 2026:

| Contract | Address |
| --- | --- |
| EventPass | [`0x58120647e754f025d77AA5c20CEc0683C5b30865`](https://sepolia.basescan.org/address/0x58120647e754f025d77AA5c20CEc0683C5b30865) |
| P2PassCore | [`0x493e4afeCDa445076f5F21FCe672fb76f117dC13`](https://sepolia.basescan.org/address/0x493e4afeCDa445076f5F21FCe672fb76f117dC13) |
| P2PassReputation | [`0xCAD812B1Fc51764043789d896e369c085A80F392`](https://sepolia.basescan.org/address/0xCAD812B1Fc51764043789d896e369c085A80F392) |

Four starter events are stored in the live core registry as event IDs `1–4`. Contract source verification on BaseScan remains optional and requires a BaseScan API key.

## Contract behavior

- One ERC-1155 token ID represents one event. Transfers are rejected at the token update hook.
- Registration must happen before the event starts. Duplicate claims and capacity bypass are rejected.
- Native ETH ticket payments stay in `P2PassCore` escrow.
- After the event, the organizer can withdraw once; 2% is retained as the protocol fee.
- Cancellation enables individual pull refunds. The contract never loops over participants to pay them.
- Only an organizer or event-authorized scanner can check in a pass owner, during the event window.
- Peer reviews require both wallets to be attended at the supplied proof event.
- Event reviews require reviewer attendance. Updating a review adjusts aggregate scores without duplicating the count.

## Local setup

Requirements: Node.js 20+, npm, and Foundry.

```bash
npm install --prefix web
(cd contracts && forge install)
cp web/.env.example web/.env.local
npm run test:contracts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without deployed addresses, the public UI runs in clearly marked preview mode with sample events; state-changing actions stay disabled.

## Deploy to Base Sepolia

1. Copy `contracts/.env.example` to `contracts/.env` and provide:

   - `BASE_SEPOLIA_RPC_URL`
   - `DEPLOYER_PRIVATE_KEY` (never commit this file)
   - Base Sepolia ETH in the deployer wallet
   - optional `BASESCAN_API_KEY`
   - optional creation fee and ERC-1155 metadata URI

2. Load the environment and deploy:

```bash
set -a
source contracts/.env
set +a
(cd contracts && forge script script/Deploy.s.sol:DeployP2Pass \
  --rpc-url base_sepolia \
  --broadcast \
  --verify)
```

3. Copy the three emitted addresses into `web/.env.local`:

```dotenv
NEXT_PUBLIC_CORE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_PASS_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS=0x...
```

4. Restart the frontend. Discovery, pass ownership, profiles, organizer management, reviews, and QR check-in will then read and write Base Sepolia directly.

The suggested `0.0002 ETH` creation fee is a fixed testnet friction value, not a USD peg. The owner can update it with `setCreationFee` when necessary.

## Verification

```bash
npm run test
```

This runs the Foundry suite, ESLint, TypeScript checks, and the optimized Next.js production build.

## QR security model

A pass QR encodes `p2pass:84532:<eventId>:<participantAddress>`. It intentionally contains no reusable secret. Contract authorization is the security boundary: only the event organizer or an explicitly authorized scanner wallet can submit a successful check-in, and the target must already own the event pass.
