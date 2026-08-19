# P2Pass

[Türkçe](README.md) | [English](README.en.md)

> No middleman. Your ticket. Your payment. Your reputation.

P2Pass is a Base Sepolia application that combines event publishing, admission, payment, attendance verification, and post-event reputation in one on-chain flow. The wallet is the user identity, a soulbound pass is the ticket, and the contracts provide the shared verification layer.

The application has no API server, database, or privileged backend service. Events, pass ownership, payments, attendance, profiles, and reviews are read from the configured contracts. If the deployment is unavailable, the interface does not substitute sample or mock data.

## The problem

Traditional event platforms keep the registration, payment, and access relationship between organizers and attendees inside a platform-controlled account system. As a result:

- Ticket ownership remains tied to a platform account and cannot be independently verified.
- Organizer revenue and settlement timing depend on platform rules.
- Attendance history cannot be used as shared proof outside the platform.
- Reviews cannot reliably prove that their authors attended the event.
- Event history may disappear when a platform or account becomes inaccessible.

## The solution

P2Pass distributes the platform-controlled record across three modular contracts:

- `P2PassCore` manages events, registrations, native ETH escrow, refunds, scanner permissions, and attendance.
- `EventPass` mints a non-transferable ERC-1155 pass for each event registration.
- `P2PassReputation` stores wallet profiles, event reviews, and peer reviews backed by shared attendance.

The frontend reads these contracts directly through wagmi and viem. Every write is explicitly confirmed in the user's wallet. A QR code carries no secret or authority; it only identifies an event and attendee. Final authorization is enforced by the contracts.

## Core flow

```text
Organizer creates an event
          |
          v
Attendee claims a free or paid pass
          |
          v
Payment remains in P2PassCore escrow
          |
          v
Organizer or authorized scanner checks in the QR
          |
          v
Attendance is verified on-chain
          |
          +------> Event review becomes available
          |
          +------> Shared attendees can review each other
          |
          v
Organizer withdraws proceeds after the event
```

## Contract architecture

### P2PassCore

P2PassCore is the authoritative event lifecycle registry.

#### Creating an event

The event name must not be empty, its start must be in the future, its end must follow the start, and the submitted ETH must exactly match the current `creationFee`. The submitting wallet becomes the organizer. A capacity of `0` means unlimited capacity.

#### Editing an event

Only the organizer can update an event. It must not be cancelled or started, and its replacement schedule must remain valid and in the future.

- Capacity cannot be reduced below the registered attendee count.
- Ticket price becomes immutable after the first pass is claimed.
- Name, description, location, image URI, schedule, and valid capacity values can be updated.

#### Claiming a pass and paying

An event must not be cancelled or started, the wallet must not already own its pass, capacity must be available, and submitted ETH must exactly match the event price.

Free events require a value of `0`. Paid values are submitted without losing wei precision and remain in Core escrow until settlement or refund. Organizers are allowed to claim a pass for their own events.

#### Check-in and scanner authorization

Check-in is available only between the event start and end times. The transaction must be submitted by the event organizer or a scanner wallet authorized for that event. The target wallet must own the pass and must not have checked in before.

A successful transaction permanently sets `attended[eventId][participant]` to `true`. Scanner permission can be granted and revoked by the organizer.

#### Cancellation, refunds, and settlement

- The organizer can cancel an event that has not been settled.
- Each attendee of a cancelled paid event withdraws their own payment through `claimRefund`.
- The pull-refund model does not loop over attendees and avoids participant-count-dependent payout gas costs.
- Proceeds for a non-cancelled event can be withdrawn once, after its end time.
- Two percent of gross proceeds is retained as the protocol fee; the remainder is sent to the organizer.

Passes are soulbound and cannot be transferred. Cancellation and refund do not burn a pass; the payment record is cleared, and the cancelled event state prevents the pass from being used.

### EventPass

EventPass is an ERC-1155 contract. Each `eventId` is also a token ID, and a wallet can own at most one pass per event.

- Only `P2PassCore` can mint passes.
- Wallet-to-wallet transfers are disabled.
- A pass cannot be sold or moved to another account.
- The metadata URI can be changed by the contract administrator.

### P2PassReputation

P2PassReputation associates profile and reputation data with wallet addresses.

#### Profiles

| Field | On-chain limit |
| --- | ---: |
| Username | 64 bytes |
| Display name | 96 bytes |
| Bio | 500 bytes |
| Avatar URI | 256 bytes |
| Website or social link | 256 bytes |

Usernames are not unique at the contract level. Multiple wallets may use the same username. The frontend searches usernames and display names through `ProfileUpdated` logs and opens wallet-address queries directly.

#### Event reviews

- Rating must be between `1` and `5`.
- A comment can contain at most 500 bytes.
- The reviewer must have an on-chain check-in for the event.
- A wallet can update its review; aggregate values are corrected without incrementing the review count twice.

#### Peer reviews

- A wallet cannot review itself.
- Reviewer and target must both have checked in to the supplied proof event.
- Rating and comment limits match event reviews.
- Updating a review replaces the existing value instead of creating a duplicate.

## Frontend structure

The frontend is built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Motion, wagmi, and viem.

### Routes

| Route | Purpose |
| --- | --- |
| `/` | Presents the motto, problem, and solution through three scroll-snap scenes. |
| `/events` | Lists, sorts, searches, and filters the on-chain event registry. |
| `/events/[id]` | Shows event details, pass claiming, refunds, and verified reviews. |
| `/passes` | Shows the connected wallet's passes and check-in QR codes. |
| `/organize` | Manages events, participants, scanner access, and settlement. |
| `/create` | Builds and submits a new event transaction. |
| `/events/[id]/edit` | Updates permitted fields of an event that has not started. |
| `/profile/[address]` | Shows a wallet profile, pass history, attendance, and peer reviews. |
| `/scan` | Validates QR or manual data and submits check-in. |

### Event discovery

- Active and upcoming events are ordered from nearest to farthest start time.
- Ended events appear dimmed at the bottom and can be hidden with a filter.
- Text search covers event name, description, and location.
- Free and paid events can be filtered.
- Cancelled events are removed from public discovery.

### Wallet, network, language, and theme

- The application targets Base Sepolia chain ID `84532`.
- A wallet on the wrong chain is prompted to switch to Base Sepolia.
- Reads use primary and fallback RPC transports.
- Writes are signed by the connected wallet and broadcast through the wallet provider.
- Contract custom errors are translated into readable Turkish and English messages.
- The interface supports Turkish and English as well as light and dark themes.

A complete wallet address opens the address profile directly. Username and display-name search scans profile logs after the Reputation deployment block. `NEXT_PUBLIC_REPUTATION_DEPLOYMENT_BLOCK` must match the configured deployment.

## QR security model

Pass QR payload format:

```text
p2pass:84532:<eventId>:<participantAddress>
```

The payload contains no private key, signature, session, or reusable secret. Possessing or copying a QR does not grant check-in authority. Before enabling the transaction, the scanner checks:

1. Is the payload valid for Base Sepolia?
2. Does the event exist, and is it not cancelled?
3. Does the participant own the pass?
4. Is the event check-in window open?
5. Has the participant already checked in?
6. Is the connected wallet the organizer or an authorized scanner?

After scanning, staff must still confirm the transaction in their wallet. Attendance is marked only after the transaction is confirmed in a block.

## Repository structure

```text
web/
  src/app/                         Next.js routes
  src/components/                  Event, pass, profile, QR, and transaction UI
  src/lib/contracts.ts             Addresses and typed ABI definitions
  src/lib/contract-errors.ts       Readable contract error messages
  src/lib/qr.ts                    QR construction and validation

contracts/
  src/P2PassCore.sol               Events, escrow, and attendance
  src/EventPass.sol                Soulbound ERC-1155 passes
  src/P2PassReputation.sol         Profiles and verified reviews
  test/P2Pass.t.sol                Lifecycle and authorization tests
  script/Deploy.s.sol              Deployment order and role wiring
```

## Current Base Sepolia deployment

| Contract | Address |
| --- | --- |
| EventPass | [`0x58120647e754f025d77AA5c20CEc0683C5b30865`](https://sepolia.basescan.org/address/0x58120647e754f025d77AA5c20CEc0683C5b30865) |
| P2PassCore | [`0x493e4afeCDa445076f5F21FCe672fb76f117dC13`](https://sepolia.basescan.org/address/0x493e4afeCDa445076f5F21FCe672fb76f117dC13) |
| P2PassReputation | [`0xCAD812B1Fc51764043789d896e369c085A80F392`](https://sepolia.basescan.org/address/0xCAD812B1Fc51764043789d896e369c085A80F392) |

Frontend changes do not require a new deployment unless Solidity source code changes. Adding event or custom-error definitions to the frontend ABI does not change deployed bytecode.

## Running locally

### Requirements

- Node.js 20 or newer
- npm
- Foundry (`forge`, `cast`)
- MetaMask or another EIP-1193-compatible wallet
- Base Sepolia ETH for write transactions

### Install dependencies

```bash
npm install --prefix web
cd contracts
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts@v5.2.0 --no-git
cd ..
```

### Frontend environment

```bash
cp web/.env.example web/.env.local
```

Use these values for the existing deployment:

```dotenv
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
NEXT_PUBLIC_CORE_CONTRACT_ADDRESS=0x493e4afeCDa445076f5F21FCe672fb76f117dC13
NEXT_PUBLIC_PASS_CONTRACT_ADDRESS=0x58120647e754f025d77AA5c20CEc0683C5b30865
NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS=0xCAD812B1Fc51764043789d896e369c085A80F392
NEXT_PUBLIC_REPUTATION_DEPLOYMENT_BLOCK=45651673
```

Public RPC services may be rate-limited. The frontend falls back between PublicNode and the Base public RPC. Wallet writes also require the RPC selected in MetaMask's Base Sepolia settings to be operational.

### Development server

```bash
npm run dev
```

The application is available at [http://localhost:3000](http://localhost:3000) by default.

### Tests and production build

```bash
npm test
```

This runs the Foundry contract tests, Vitest tests, ESLint, and the optimized Next.js production build.

Individual commands:

```bash
npm run test:contracts
npm run test:web
npm run lint
npm run build
```

Run a production build locally:

```bash
npm run build
npm --prefix web run start
```

## Deploying new contracts

This section is required only when Solidity source code changes or a separate deployment is needed.

```bash
cp contracts/.env.example contracts/.env
```

```dotenv
BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
DEPLOYER_PRIVATE_KEY=0x...
BASESCAN_API_KEY=
EVENT_CREATION_FEE_WEI=200000000000000
PASS_METADATA_URI=ipfs://YOUR_CID/{id}.json
```

Never commit or share the private key, even when it controls only a testnet wallet. The deployer needs Base Sepolia ETH for gas.

```bash
set -a
source contracts/.env
set +a

cd contracts
forge script script/Deploy.s.sol:DeployP2Pass \
  --rpc-url base_sepolia \
  --broadcast
cd ..
```

Add `--verify` after configuring `BASESCAN_API_KEY` if source verification is required.

Deployment order:

1. `EventPass`
2. `P2PassCore`
3. Grant `MINTER_ROLE` to Core
4. Deploy `P2PassReputation` with the immutable Core address

Copy the emitted addresses into the frontend environment. Set `NEXT_PUBLIC_REPUTATION_DEPLOYMENT_BLOCK` to the Reputation deployment block, then rebuild the frontend.

## Vercel deployment

The Vercel root directory can be set to `web`, or the root npm scripts can be used. Configure these variables in Project Settings:

```text
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL
NEXT_PUBLIC_CORE_CONTRACT_ADDRESS
NEXT_PUBLIC_PASS_CONTRACT_ADDRESS
NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS
NEXT_PUBLIC_REPUTATION_DEPLOYMENT_BLOCK
```

`NEXT_PUBLIC_` values are embedded in the frontend bundle at build time, so changing them requires a new deployment. No private key belongs in the frontend or Vercel environment.

## Limits and trust assumptions

- The current deployment is for Base Sepolia and must not be treated as a production system carrying real value.
- Contracts are covered by automated tests but have not received an independent security audit.
- Username uniqueness is not enforced by the contract.
- The application stores image URIs but does not provide an image-upload service.
- Public RPC services can temporarily rate-limit requests or return `503` errors.
- The frontend cannot submit a transaction without wallet confirmation.
- QR payloads are public; the security boundary is the pass, time-window, and scanner-authorization checks in the contract.

## License

This repository is licensed under the [MIT License](LICENSE).
