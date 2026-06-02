"use client"

import { useWallet } from "@solana/wallet-adapter-react"

export function useAccount() {
  const { publicKey, connected, connecting, disconnecting } = useWallet()
  return {
    address: publicKey?.toBase58() ?? null,
    isConnected: connected,
    isConnecting: connecting,
    isDisconnected: !connected && !connecting,
    isReconnecting: false,
    publicKey,
  }
}
