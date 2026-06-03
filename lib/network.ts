// lib/network.ts
// Network configuration for mainnet/devnet switching

export type SolanaNetwork = "mainnet-beta" | "devnet";

export const NETWORKS: Record<SolanaNetwork, { label: string; rpcUrl: string; explorerCluster: string }> = {
  "mainnet-beta": {
    label: "Mainnet",
    rpcUrl:
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SYNAPSE_RPC_URL) ||
      "https://api.mainnet-beta.solana.com",
    explorerCluster: "",
  },
  devnet: {
    label: "Devnet",
    rpcUrl: "https://api.devnet.solana.com",
    explorerCluster: "?cluster=devnet",
  },
};

export const DEFAULT_NETWORK: SolanaNetwork = "devnet";
export const NETWORK_STORAGE_KEY = "bogent_network";

export function getStoredNetwork(): SolanaNetwork {
  if (typeof window === "undefined") return DEFAULT_NETWORK;
  const stored = localStorage.getItem(NETWORK_STORAGE_KEY);
  if (stored === "mainnet-beta" || stored === "devnet") return stored;
  return DEFAULT_NETWORK;
}

export function setStoredNetwork(network: SolanaNetwork): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NETWORK_STORAGE_KEY, network);
}

export function getExplorerUrl(path: string, network: SolanaNetwork): string {
  const cluster = NETWORKS[network].explorerCluster;
  return `https://explorer.solana.com/${path}${cluster}`;
}
