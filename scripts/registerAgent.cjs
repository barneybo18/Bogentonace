"use strict";
// ============================================================
//  BOGENT — SAP Registration Script (CommonJS)
//  Usage: npm run register-agent
//  Env: DOTENV_CONFIG_PATH=.env.local (already loaded below)
// ============================================================

require("dotenv").config({ path: ".env.local" });

const { Keypair, SystemProgram } = require("@solana/web3.js");
const bs58Pkg = require("bs58");
const bs58 = bs58Pkg.default || bs58Pkg;

const { SapClient } = require("./../node_modules/@oobe-protocol-labs/synapse-sap-sdk/dist/cjs/index.js");
const { deriveAgent, deriveAgentStats, deriveGlobalRegistry } = require("./../node_modules/@oobe-protocol-labs/synapse-sap-sdk/dist/cjs/pda/index.js");

// Use mainnet-beta as the reliable RPC for transaction submission
// The staging OOBE RPC is for Synapse-specific reads; mainnet-beta for tx sending
const RELIABLE_RPC = "https://solana-mainnet.g.alchemy.com/v2/demo"; // fallback

async function main() {
  // ── Validate env ─────────────────────────────────────────
  const rpcUrl = process.env.SYNAPSE_RPC_URL;
  const privateKey = process.env.SOLANA_PRIVATE_KEY;

  if (!rpcUrl) throw new Error("Missing SYNAPSE_RPC_URL in .env.local");
  if (!privateKey) throw new Error("Missing SOLANA_PRIVATE_KEY in .env.local");

  // ── Decode wallet keypair ────────────────────────────────
  const secretKey = bs58.decode(privateKey);
  const keypair = Keypair.fromSecretKey(secretKey);
  const anchorPkg = require("@coral-xyz/anchor");
  const wallet = new anchorPkg.Wallet(keypair);
  console.log("\n🔑 Wallet Public Key:", wallet.publicKey.toBase58());

  // ── Create SAP client ────────────────────────────────────
  // Use mainnet-beta for transaction submission and simulation
  const mainnetRpcUrl = "https://api.mainnet-beta.solana.com";
  const client = new SapClient({ rpcUrl: mainnetRpcUrl, wallet });
  console.log("✅ SAP Client initialized");
  console.log("   RPC:", mainnetRpcUrl);

  // ── Derive PDAs ──────────────────────────────────────────
  const programId = client.programId;
  const [agentPda]  = deriveAgent(wallet.publicKey, programId);
  const [statsPda]  = deriveAgentStats(agentPda, programId);
  const [globalPda] = deriveGlobalRegistry(programId);

  console.log("\n📍 Derived Addresses:");
  console.log("   Agent PDA:  ", agentPda.toBase58());
  console.log("   Stats PDA:  ", statsPda.toBase58());
  console.log("   Global PDA: ", globalPda.toBase58());

  // ── Check if already registered ─────────────────────────
  console.log("\n🔍 Checking if agent already registered...");
  try {
    const existing = await client.agent.fetchNullable(wallet.publicKey);
    if (existing) {
      console.log("\n⚠️  Agent already registered!");
      console.log("📝 Agent PDA:", agentPda.toBase58());
      console.log("\nAdd this to your .env.local:");
      console.log(`SAP_AGENT_ID=${agentPda.toBase58()}`);
      console.log(`NEXT_PUBLIC_SAP_AGENT_ID=${agentPda.toBase58()}`);
      return;
    }
  } catch (_) {
    // Not registered yet — proceed
  }

  // ── Agent registration params ─────────────────────────────
  const name = "BOGENT";
  const description = "Autonomous payment agent: discovers tools via SAP, executes AI tasks via AceDataCloud, settles micropayments via x402";
  const capabilities = [
    { id: "acedata:task-execution", description: "Execute AI tasks via AceDataCloud APIs", protocolId: "acedata", version: "1.0.0" },
    { id: "x402:payments",          description: "Settle micropayments using x402 protocol", protocolId: "x402", version: "1.0.0" },
    { id: "sap:tool-discovery",     description: "Discover and integrate tools from SAP registry", protocolId: "sap", version: "1.0.0" },
  ];
  const pricing = [];
  const protocols = ["acedata", "x402", "sap"];
  const agentId = null;
  const agentUri = null;
  const x402Endpoint = process.env.SAP_X402_ENDPOINT && process.env.SAP_X402_ENDPOINT !== "https://api.example.com/x402"
    ? process.env.SAP_X402_ENDPOINT
    : null;

  console.log("\n🚀 Registering BOGENT on SAP mainnet...");
  console.log("   Name:", name);
  console.log("   Capabilities:", capabilities.length);
  console.log("   Protocols:", protocols.join(", "));

  // ── Call registerAgent with full context ─────────────────
  console.log("\n⏳ Sending transaction (this may take 30-60s)...");
  const txSignature = await client.program.methods.registerAgent(
    name,
    description,
    capabilities,
    pricing,
    protocols,
    agentId,
    agentUri,
    x402Endpoint
  ).accounts({
    wallet: wallet.publicKey,
    agent: agentPda,
    agentStats: statsPda,
    globalRegistry: globalPda,
    systemProgram: SystemProgram.programId,
  }).rpc();

  const agentIdStr = agentPda.toBase58();

  console.log("\n🎉 SUCCESS! Agent registered on SAP mainnet!");
  console.log("📝 Transaction:", `https://solscan.io/tx/${txSignature}`);
  console.log("🔗 Explorer:  ", `https://explorer.oobeprotocol.ai/agents/${agentIdStr}`);
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 COPY THIS TO .env.local:");
  console.log(`SAP_AGENT_ID=${agentIdStr}`);
  console.log(`NEXT_PUBLIC_SAP_AGENT_ID=${agentIdStr}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
  console.error("\n❌ Registration failed:", err.message);
  if (err.logs) {
    console.error("Program logs:", err.logs.join("\n"));
  }
  process.exit(1);
});
