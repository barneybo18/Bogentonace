"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { SolanaNetwork, getStoredNetwork, setStoredNetwork, NETWORKS } from "@/lib/network";

interface NetworkContextType {
  network: SolanaNetwork;
  setNetwork: (n: SolanaNetwork) => void;
  rpcUrl: string;
  isMainnet: boolean;
  isDevnet: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  network: "devnet",
  setNetwork: () => {},
  rpcUrl: NETWORKS["devnet"].rpcUrl,
  isMainnet: false,
  isDevnet: true,
});

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<SolanaNetwork>("devnet");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setNetworkState(getStoredNetwork());
    setMounted(true);
  }, []);

  const setNetwork = useCallback((n: SolanaNetwork) => {
    setStoredNetwork(n);
    setNetworkState(n);
    // Reload the page so the ConnectionProvider picks up the new RPC URL
    window.location.reload();
  }, []);

  const rpcUrl = NETWORKS[network].rpcUrl;

  return (
    <NetworkContext.Provider
      value={{
        network,
        setNetwork,
        rpcUrl,
        isMainnet: network === "mainnet-beta",
        isDevnet: network === "devnet",
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
