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
