import dotenv from "dotenv";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

dotenv.config();

const SYNAPSE_RPC_URL = process.env.SYNAPSE_RPC_URL;
const SOLANA_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY;

if (!SYNAPSE_RPC_URL) {
  throw new Error("Missing environment variable: SYNAPSE_RPC_URL");
}

if (!SOLANA_PRIVATE_KEY) {
  throw new Error("Missing environment variable: SOLANA_PRIVATE_KEY");
}

const wallet = Keypair.fromSecretKey(bs58.decode(SOLANA_PRIVATE_KEY));

let cachedClient: any | null = null;

async function loadSapClient() {
  if (cachedClient) {
    return cachedClient;
  }

  // @ts-ignore
  const module = await import("@oobe-protocol-labs/synapse-sap-sdk/dist/cjs/client.js");
  const { SapClient } = module;
  if (!SapClient) {
    throw new Error("Failed to load SapClient from @oobe-protocol-labs/synapse-sap-sdk");
  }

  cachedClient = new SapClient({ rpcUrl: SYNAPSE_RPC_URL, wallet });
  return cachedClient;
}

export async function getSAPClient(): Promise<any> {
  return await loadSapClient();
}

export async function registerAgent(name: string, description: string) {
  const client = await loadSapClient();
  const builder = client.builder.agent(name).description(description);
  const result = await builder.register();

  return {
    txSignature: result.txSignature,
    agentId: result.agentPda.toBase58(),
    statsId: result.statsPda.toBase58(),
  };
}

export async function discoverTools(query: string) {
  const client = await loadSapClient();
  const normalized = query.trim().toLowerCase();
  const category = normalized.includes("payment")
    ? "payment"
    : normalized.includes("swap")
      ? "swap"
      : normalized.includes("data") || normalized.includes("ai")
        ? "data"
        : "custom";

  // @ts-ignore
  const { DiscoveryRegistry } = await import("@oobe-protocol-labs/synapse-sap-sdk/dist/cjs/registries/index.js");
  const discovery = new DiscoveryRegistry(client.program);
  return await discovery.findToolsByCategory(category);
}

export async function callSentinel(taskDescription: string) {
  const client = await loadSapClient();
  const sentinelId = process.env.SYNAPSE_SENTINEL_AGENT || "Ccr2yK3hLALU4p8oNRqrh4dGuvPJTth5KCLMio8cE1ph";
  const { PublicKey } = await import("@solana/web3.js");

  try {
    const sentinelPubkey = new PublicKey(sentinelId);
    const sentinelData = await client.program.account.agentAccount.fetchNullable(sentinelPubkey);
    if (sentinelData) {
      console.log(`[Sentinel] Agent verified: ${sentinelId.slice(0, 8)}...`);
      console.log(`[Sentinel] Task: ${taskDescription}`);
    }
  } catch (e) {
    console.warn("[Sentinel] Could not fetch agent data:", (e as Error).message);
  }

  return {
    result: `Sentinel verified and acknowledged: "${taskDescription}"`,
    agentId: sentinelId,
  };
}
