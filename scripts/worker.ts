import { discoverTools, callSentinel } from "./sapClient";
import { summarizeText, extractDocumentData, analyzeSentiment } from "../lib/acedataClient";
import { payWithX402 } from "../lib/x402Client";
import bs58 from "bs58";

const POLL_INTERVAL_MS = 30_000;

async function processScheduledPayments(connection: any, payerKeypair: any) {
  console.log("\n[Scheduled Payments] Checking for due payments...");
  const fs = require("fs");
  const path = require("path");
  
  const DB_PATH = path.join(__dirname, "..", "cache", "scheduled_payments.json");
  const HISTORY_PATH = path.join(__dirname, "..", "cache", "agent_history.json");
  
  if (!fs.existsSync(DB_PATH)) {
    console.log("[Scheduled Payments] No database found.");
    return;
  }
  
  let payments: any[] = [];
  try {
    payments = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch (e: any) {
    console.error("[Scheduled Payments] Failed to parse database:", e.message);
    return;
  }
  
  const now = Math.floor(Date.now() / 1000);
  let updated = false;
  
  for (let i = 0; i < payments.length; i++) {
    const p = payments[i];
    if (p.isActive && now >= Number(p.nextExecution)) {
      console.log(`[Scheduled Payments] 🎯 Agent #${p.id} ("${p.description}") is due!`);
      const amount = BigInt(p.amount);
      const balance = BigInt(p.balance);
      
      if (balance < amount) {
        console.warn(`[Scheduled Payments] ⚠️ Agent #${p.id} has insufficient balance (balance: ${balance}, required: ${amount}). Deactivating...`);
        p.isActive = false;
        updated = true;
        continue;
      }
      
      // Perform transfer
      try {
        console.log(`[Scheduled Payments] Sending ${Number(amount) / 1e9} SOL to ${p.to}...`);
        const { Transaction, SystemProgram, sendAndConfirmTransaction, PublicKey } = require("@solana/web3.js");
        
        const toPubkey = new PublicKey(p.to);
        const transferTx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: payerKeypair.publicKey,
            toPubkey: toPubkey,
            lamports: Number(amount),
          })
        );
        
        const latestBlock = await connection.getLatestBlockhash("confirmed");
        transferTx.recentBlockhash = latestBlock.blockhash;
        transferTx.feePayer = payerKeypair.publicKey;
        
        const txSignature = await sendAndConfirmTransaction(
          connection,
          transferTx,
          [payerKeypair],
          { skipPreflight: true }
        );
        
        console.log(`[Scheduled Payments] ✅ Payment successful! Signature: ${txSignature}`);
        
        // Update database record
        p.balance = (balance - amount).toString();
        p.nextExecution = (now + Number(p.interval)).toString();
        updated = true;
        
        // Save history log
        let history: any[] = [];
        if (fs.existsSync(HISTORY_PATH)) {
          try {
            history = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf-8"));
          } catch (err) {}
        }
        history.push({
          agentId: p.id.toString(),
          transactionHash: txSignature,
          amount: amount.toString(),
          timestamp: now.toString(),
        });
        fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
        
      } catch (err: any) {
        console.error(`[Scheduled Payments] ❌ Failed to execute payment:`, err.message);
      }
    }
  }
  
  if (updated) {
    fs.writeFileSync(DB_PATH, JSON.stringify(payments, null, 2));
    console.log("[Scheduled Payments] Saved updated agent balances and schedules.");
  } else {
    console.log("[Scheduled Payments] No payments were due or updated.");
  }
}

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

  // Step 6: Process scheduled payments from database
  try {
    const { Connection, Keypair } = require("@solana/web3.js");
    const isDevnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK === "devnet";
    const rpcUrl = isDevnet ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");
    const payerKeypair = Keypair.fromSecretKey(walletSecret);
    await processScheduledPayments(connection, payerKeypair);
  } catch (e: any) {
    console.log("[Scheduled Payments] ⚠️ Failed processing scheduled payments step:", e.message);
  }
}

async function main() {
  const isDevnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK === "devnet";
  console.log("BOGENT worker started on " + (isDevnet ? "Solana devnet" : "Solana mainnet"));
  
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
