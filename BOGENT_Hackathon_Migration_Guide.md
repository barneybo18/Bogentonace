# BOGENT → SAP/Solana Hackathon Migration Guide

**Target:** OOBE Protocol × Ace Data Cloud Bounty  
**Recommended Category:** Category 2 — Ace Data Cloud Usage (x402 Facilitator)  
**Why Cat. 2?** AceDataCloud gives free credits on signup, the x402 SDK is ready-to-use, and your existing scheduled-payment agent maps directly to the 3-API requirement.

---

## What You Are Migrating

Your current stack runs on **Mantle (EVM)** with a custom Solidity contract, wagmi/viem, and a hardhat worker. The hackathon requires **Solana**, the **SAP SDK**, **Synapse RPC**, **Ace Data Cloud APIs**, and an **x402** or **escrow** payment flow. Below is a file-by-file plan written for an AI agent to execute.

---

## 1. Environment & Dependencies

### 1.1 Remove (EVM-specific)

```bash
# Remove these from package.json dependencies
wagmi
viem
@rainbow-me/rainbowkit
ethers
hardhat
@nomicfoundation/hardhat-toolbox
@openzeppelin/contracts
```

### 1.2 Add (Solana + SAP + AceDataCloud)

```bash
npm install \
  @solana/web3.js \
  @solana/wallet-adapter-base \
  @solana/wallet-adapter-react \
  @solana/wallet-adapter-react-ui \
  @solana/wallet-adapter-wallets \
  @oobe/sap-sdk \
  @oobe/synapse-client-sdk \
  @acedatacloud/x402client \
  axios \
  bs58
```

> **Note:** Check exact package names on npm and the OOBE GitHub repos — they may differ slightly from the above aliases. The canonical sources are:
> - SAP SDK: https://github.com/OOBE-PROTOCOL/synapse-sap-sdk
> - Synapse Client SDK: https://github.com/OOBE-PROTOCOL/synapse-client-sdk
> - AceDataCloud X402Client: https://github.com/AceDataCloud/X402Client

### 1.3 New `.env` Keys (replace the old `PRIVATE_KEY` Mantle config)

```env
# Solana
SOLANA_PRIVATE_KEY=<base58-encoded keypair>
SOLANA_RPC_URL=<synapse-rpc-endpoint>        # From Synapse Gateway free tier

# SAP
SAP_AGENT_ID=<your registered agent public key>

# Ace Data Cloud
ACEDATA_API_KEY=<from platform.acedata.cloud after signup>
ACEDATA_BASE_URL=https://api.acedata.cloud

# x402 / Synapse
SYNAPSE_RPC_URL=<your synapse rpc url>       # Same as SOLANA_RPC_URL
SYNAPSE_SENTINEL_AGENT=Ccr2yK3hLALU4p8oNRqrh4dGuvPJTth5KCLMio8cE1ph

# Next.js public vars (exposed to browser)
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SAP_AGENT_ID=<same as SAP_AGENT_ID>
```

---

## 2. File Changes — Delete or Gut

### `hardhat.config.js` → DELETE

Remove entirely. No Solidity compilation needed; SAP programs are already deployed on Solana mainnet.

### `contracts/AgentPay.sol` → DELETE

Your payment logic will be handled by:
- SAP on-chain program (via SAP SDK)
- x402 payment flow (via AceDataCloud X402Client)

### `artifacts/` directory → DELETE

Build artifacts from the Solidity contract. No longer needed.

### `scripts/deploy.js` → DELETE

No contract deployment; instead you register your agent on SAP.

---

## 3. File Changes — Replace or Rewrite

### `lib/mantle.ts` → Rewrite as `lib/solana.ts`

**DELETE** all Mantle-specific chain config and replace with:

```typescript
// lib/solana.ts
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

export const SYNAPSE_RPC_URL =
  process.env.NEXT_PUBLIC_SYNAPSE_RPC_URL ||
  clusterApiUrl("mainnet-beta");

export const getSolanaConnection = () =>
  new Connection(SYNAPSE_RPC_URL, "confirmed");

export const EXPLORER_BASE = "https://explorer.solana.com/tx";

export function getExplorerUrl(txSignature: string): string {
  return `${EXPLORER_BASE}/${txSignature}`;
}

export function getSAPExplorerUrl(agentId: string): string {
  return `https://explorer.oobeprotocol.ai/agents/${agentId}`;
}
```

### `lib/contracts.ts` → Rewrite as `lib/sap.ts`

**DELETE** all EVM contract addresses, ABIs, and token addresses. Replace with:

```typescript
// lib/sap.ts
export const SAP_AGENT_ID =
  process.env.NEXT_PUBLIC_SAP_AGENT_ID || "";

export const SYNAPSE_SENTINEL_AGENT =
  "Ccr2yK3hLALU4p8oNRqrh4dGuvPJTth5KCLMio8cE1ph";

// Ace Data Cloud — pick 3+ of these API slugs for Cat. 2 compliance
export const ACEDATA_SERVICES = {
  textSummary:    "/v1/text/summary",
  imageAnalysis:  "/v1/vision/analyze",
  dataExtract:    "/v1/document/extract",
  translation:    "/v1/text/translate",
  sentiment:      "/v1/text/sentiment",
} as const;

// SOL token mint (for payment amounts if using SPL)
export const SOL_MINT = "So11111111111111111111111111111111111111112";
```

### `components/AppProviders.tsx` → Replace wallet providers

**REMOVE** wagmi, RainbowKit, and viem providers. **ADD** Solana wallet adapter:

```tsx
// components/AppProviders.tsx
"use client";
import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { SYNAPSE_RPC_URL } from "@/lib/solana";
import "@solana/wallet-adapter-react-ui/styles.css";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={SYNAPSE_RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

---

## 4. Files to Create (New)

### `lib/sapClient.ts` — SAP SDK wrapper

```typescript
// lib/sapClient.ts
// AI agent instruction: install @oobe/sap-sdk, then implement:
import { SAPClient } from "@oobe/sap-sdk";

let _client: SAPClient | null = null;

export function getSAPClient(): SAPClient {
  if (!_client) {
    _client = new SAPClient({
      rpcUrl: process.env.SYNAPSE_RPC_URL!,
      agentId: process.env.SAP_AGENT_ID!,
    });
  }
  return _client;
}

// Register your agent once (run via scripts/registerAgent.ts)
export async function registerAgent(name: string, description: string) {
  const client = getSAPClient();
  return client.registerAgent({ name, description, network: "mainnet" });
}

// Discover tools from SAP registry
export async function discoverTools(query: string) {
  const client = getSAPClient();
  return client.discoverTools({ query });
}

// Call Synapse Sentinel (required for both categories)
export async function callSentinel(taskDescription: string) {
  const client = getSAPClient();
  return client.callAgent({
    agentId: process.env.SYNAPSE_SENTINEL_AGENT!,
    task: taskDescription,
  });
}
```

### `lib/acedataClient.ts` — Ace Data Cloud wrapper (3+ APIs)

```typescript
// lib/acedataClient.ts
// AI agent instruction: Uses fetch with ACEDATA_API_KEY header.
// Must call at least 3 distinct service endpoints for Cat. 2 compliance.
import axios from "axios";

const BASE = process.env.ACEDATA_BASE_URL || "https://api.acedata.cloud";
const KEY  = process.env.ACEDATA_API_KEY!;

const client = axios.create({
  baseURL: BASE,
  headers: { Authorization: `Bearer ${KEY}` },
});

// Service 1: Summarize invoice/payment description
export async function summarizeText(text: string): Promise<string> {
  const res = await client.post("/v1/text/summary", { text, max_length: 100 });
  return res.data.summary;
}

// Service 2: Extract structured data from a document/receipt
export async function extractDocumentData(content: string): Promise<Record<string, unknown>> {
  const res = await client.post("/v1/document/extract", { content });
  return res.data.fields;
}

// Service 3: Sentiment analysis on payment notes
export async function analyzeSentiment(text: string): Promise<{ label: string; score: number }> {
  const res = await client.post("/v1/text/sentiment", { text });
  return { label: res.data.label, score: res.data.score };
}

// Bonus Service 4: Translate description (optional, extra API diversity)
export async function translateText(text: string, targetLang: string): Promise<string> {
  const res = await client.post("/v1/text/translate", { text, target: targetLang });
  return res.data.translated;
}
```

> **Verify the actual API endpoint paths** at https://platform.acedata.cloud after signup — the paths above are illustrative patterns. Match to the real API docs for the services you choose.

### `lib/x402Client.ts` — x402 Payment via AceDataCloud facilitator

```typescript
// lib/x402Client.ts
// AI agent instruction: Uses AceDataCloud X402Client SDK.
// See: https://github.com/AceDataCloud/X402Client
import { X402Client } from "@acedatacloud/x402client";
import { getSolanaConnection } from "./solana";

export async function payWithX402(params: {
  serviceUrl: string;     // AceDataCloud endpoint being paid for
  amount: number;         // amount in lamports or USDC units
  walletSecret: Uint8Array;
}) {
  const x402 = new X402Client({
    rpcUrl: process.env.SYNAPSE_RPC_URL!,
    facilitator: "acedata",  // uses AceDataCloud's own facilitator
  });

  return x402.pay({
    url: params.serviceUrl,
    amount: params.amount,
    signerSecret: params.walletSecret,
  });
}
```

### `scripts/registerAgent.ts` — One-time agent registration on SAP mainnet

```typescript
// scripts/registerAgent.ts
// Run once: npx ts-node scripts/registerAgent.ts
import { registerAgent } from "../lib/sapClient";

async function main() {
  console.log("Registering BOGENT on SAP mainnet...");
  const result = await registerAgent(
    "BOGENT",
    "Autonomous payment agent: discovers tools via SAP, executes AI tasks via AceDataCloud, settles via x402"
  );
  console.log("Agent registered:", result);
  console.log("View on explorer:", `https://explorer.oobeprotocol.ai/agents/${result.agentId}`);
  console.log("Save this to .env as SAP_AGENT_ID=", result.agentId);
}

main().catch(console.error);
```

### `scripts/worker.ts` — Replace the old hardhat worker

**DELETE** `scripts/worker.js` (the hardhat/ethers version).  
**CREATE** `scripts/worker.ts`:

```typescript
// scripts/worker.ts
// Replaces the old hardhat worker. Run with: npx ts-node scripts/worker.ts
import { discoverTools, callSentinel, getSAPClient } from "../lib/sapClient";
import { summarizeText, extractDocumentData, analyzeSentiment } from "../lib/acedataClient";
import { payWithX402 } from "../lib/x402Client";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const POLL_INTERVAL_MS = 30_000;

async function processWorkflow() {
  console.log(`[${new Date().toISOString()}] Starting agent workflow...`);

  // Step 1: Discover tools via SAP
  const tools = await discoverTools("payment execution AI");
  console.log(`Discovered ${tools.length} tools`);

  // Step 2: Execute Ace Data Cloud AI tasks (3 services = Cat. 2 requirement)
  const invoiceText = "Payment for AI inference services Q2";
  const summary   = await summarizeText(invoiceText);
  const fields    = await extractDocumentData(invoiceText);
  const sentiment = await analyzeSentiment(invoiceText);
  console.log("AI outputs:", { summary, fields, sentiment });

  // Step 3: Call Synapse Sentinel (required for both categories)
  const sentinelResult = await callSentinel(
    `Verify and authorize payment for: ${summary}`
  );
  console.log("Sentinel result:", sentinelResult);

  // Step 4: Settle via x402 (Category 2)
  const walletSecret = bs58.decode(process.env.SOLANA_PRIVATE_KEY!);
  const paymentResult = await payWithX402({
    serviceUrl: `${process.env.ACEDATA_BASE_URL}/v1/text/summary`,
    amount: 1000,  // lamports or smallest unit
    walletSecret,
  });
  console.log("Payment settled:", paymentResult.txSignature);
}

async function main() {
  console.log("BOGENT worker started on Solana mainnet");
  while (true) {
    try {
      await processWorkflow();
    } catch (err) {
      console.error("Workflow error:", (err as Error).message);
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
}

main();
```

### `.github/workflows/worker.yml` — Update CI worker

**MODIFY** the existing workflow to remove hardhat/mantle network flags:

```yaml
# .github/workflows/worker.yml
name: BOGENT Solana Worker
on:
  schedule:
    - cron: '*/5 * * * *'   # every 5 minutes
  workflow_dispatch:

jobs:
  run-worker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - name: Run agent worker (single cycle)
        env:
          SOLANA_PRIVATE_KEY: ${{ secrets.SOLANA_PRIVATE_KEY }}
          SYNAPSE_RPC_URL: ${{ secrets.SYNAPSE_RPC_URL }}
          SAP_AGENT_ID: ${{ secrets.SAP_AGENT_ID }}
          ACEDATA_API_KEY: ${{ secrets.ACEDATA_API_KEY }}
          ACEDATA_BASE_URL: https://api.acedata.cloud
          SYNAPSE_SENTINEL_AGENT: Ccr2yK3hLALU4p8oNRqrh4dGuvPJTth5KCLMio8cE1ph
        run: npx ts-node scripts/worker.ts --once  # add --once flag to exit after single run
```

---

## 5. Frontend Updates

### `components/NetworkBadge.tsx`

**REPLACE** the Mantle chain check with a Solana network badge:

```tsx
// Old: checks chainId 5000/5003 for Mantle
// New: check Solana connection cluster
import { useConnection } from "@solana/wallet-adapter-react";

export function NetworkBadge() {
  const { connection } = useConnection();
  const endpoint = connection.rpcEndpoint;
  const isMainnet = endpoint.includes("mainnet");
  return (
    <span className={isMainnet ? "badge-green" : "badge-yellow"}>
      {isMainnet ? "Solana Mainnet" : "Solana Devnet"}
    </span>
  );
}
```

### All hooks (`hooks/*.ts`)

Each hook that calls contract functions via wagmi/viem needs to be replaced with SAP SDK or Solana web3 equivalents.

**Pattern to follow for every hook:**

```typescript
// OLD pattern (wagmi)
import { useWriteContract } from "wagmi";
const { writeContract } = useWriteContract();
writeContract({ address: AGENT_PAY_ADDRESS, abi: AGENT_PAY_ABI, functionName: "createScheduledPayment", args: [...] });

// NEW pattern (SAP SDK + Solana)
import { getSAPClient } from "@/lib/sapClient";
const client = getSAPClient();
await client.createScheduledPayment({ to, amount, interval, description });
```

**Hooks to update (in priority order):**

| Hook | Old dependency | New action |
|---|---|---|
| `useCreateAgent.ts` | wagmi `useWriteContract` | Use `sapClient.registerAgent()` |
| `useAgents.ts` | wagmi `useReadContract` | Use `sapClient.listAgents()` |
| `useCreateInvoice.ts` | wagmi `useWriteContract` | Use SAP invoice API or AceDataCloud |
| `usePayInvoice.ts` | wagmi `useWriteContract` | Use `payWithX402()` |
| `useScheduledPayments.ts` | wagmi `useReadContract` | Use `sapClient.getScheduledPayments()` |
| `useToggleAgentStatus.ts` | wagmi `useWriteContract` | Use `sapClient.toggleAgent()` |
| `useTopUpAgent.ts` | wagmi + ERC20 | Use Solana SPL token transfer |
| `useDeleteAgent.ts` | wagmi `useWriteContract` | Use `sapClient.cancelAgent()` |
| `useTokenApproval.ts` | wagmi ERC20 approve | DELETE — not needed on Solana |

---

## 6. Hackathon Compliance Checklist

Use this to verify all requirements are met before submission.

### Category 2 (Ace Data Cloud Usage) — Required

- [ ] Agent registered on SAP mainnet (`scripts/registerAgent.ts` run successfully)
- [ ] Agent visible at `https://explorer.oobeprotocol.ai/agents/<YOUR_AGENT_ID>`
- [ ] Automated workflow runs trigger → execution → payment without manual input
- [ ] AceDataCloud account created at `platform.acedata.cloud`
- [ ] **3+ distinct AceDataCloud API services** called in a single workflow run (e.g. text/summary + document/extract + text/sentiment)
- [ ] x402 payment made via AceDataCloud's own facilitator (not raw Solana transfer)
- [ ] Synapse RPC used for execution (not public Solana RPC)
- [ ] Synapse Sentinel agent called at least once per workflow run

### Category 1 (General Payment Volume) — If targeting instead

- [ ] Agent registered on SAP mainnet
- [ ] On-chain escrow payments via Synapse RPC (not x402 facilitator)
- [ ] At least one AI capability in workflow
- [ ] Synapse Sentinel called at least once

### Submission

- [ ] Demo video showing end-to-end autonomous run (no manual steps)
- [ ] GitHub repo shared publicly
- [ ] Post on X tagging @OOBEonSol and @AceDataCloud
- [ ] Category clearly stated in post

---

## 7. Recommended Ace Data Cloud Services (for 3+ requirement)

These three services form a natural pipeline for a payment agent:

1. **Text Summarization** — Summarize invoice descriptions before paying. Makes audit logs human-readable.
2. **Document Extraction** — Parse structured fields (amount, recipient, due date) from invoice text.
3. **Sentiment Analysis** — Flag invoices with suspicious or ambiguous language before processing payment.

Optional 4th service to boost volume:
4. **Translation** — Localize invoice descriptions for international recipients.

Sign up at `platform.acedata.cloud` — free credits are automatically applied on registration with Google/GitHub.

---

## 8. Key Resource Links

| Resource | URL |
|---|---|
| SAP SDK (GitHub) | https://github.com/OOBE-PROTOCOL/synapse-sap-sdk |
| Synapse Client SDK | https://github.com/OOBE-PROTOCOL/synapse-client-sdk |
| SAP Docs | https://explorer.oobeprotocol.ai/docs |
| Synapse Explorer | https://explorer.oobeprotocol.ai |
| Synapse Gateway (RPC) | https://synapse.oobeprotocol.ai |
| Synapse Sentinel agent | `Ccr2yK3hLALU4p8oNRqrh4dGuvPJTth5KCLMio8cE1ph` |
| AceDataCloud Platform | https://platform.acedata.cloud |
| AceDataCloud X402Client | https://github.com/AceDataCloud/X402Client |
| AceDataCloud Roadmap/APIs | https://roadmap.acedata.cloud |
| OOBE Studio | https://studio.oobeprotocol.ai |
