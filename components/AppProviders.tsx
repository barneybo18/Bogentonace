"use client";
import * as React from "react";
import { useMemo, Suspense } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WelcomePopup } from "./WelcomePopup";
import { LoadingPopup } from "./LoadingPopup";
import { NetworkProvider } from "./NetworkProvider";
import { getStoredNetwork, NETWORKS } from "@/lib/network";

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  const [endpoint, setEndpoint] = React.useState(NETWORKS["devnet"].rpcUrl);

  React.useEffect(() => {
    const network = getStoredNetwork();
    setEndpoint(NETWORKS[network].rpcUrl);
  }, []);

  return (
    <NetworkProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <QueryClientProvider client={queryClient}>
              <WelcomePopup />
              <Suspense fallback={null}>
                <LoadingPopup />
              </Suspense>
              {children}
            </QueryClientProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </NetworkProvider>
  );
}
