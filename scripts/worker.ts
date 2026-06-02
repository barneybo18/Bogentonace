import { discoverTools, callSentinel } from "./sapClient";
import { summarizeText, extractDocumentData, analyzeSentiment } from "../lib/acedataClient";
import { payWithX402 } from "../lib/x402Client";
import bs58 from "bs58";

const POLL_INTERVAL_MS = 30_000;

async function processWorkflow() {
  console.log(`[${new Date().toISOString()}] Starting agent workflow...`);

  // Step 1: Discover tools via SAP
  const tools = await discoverTools("payment execution AI");
  console.log(`Discovered ${tools?.length || 0} tools`);

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
  // If run with --once flag (e.g. in CI), only run once and exit.
  if (process.argv.includes("--once")) {
    try {
      await processWorkflow();
    } catch (err) {
      console.error("Workflow error:", (err as Error).message);
      process.exit(1);
    }
    process.exit(0);
  }

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
