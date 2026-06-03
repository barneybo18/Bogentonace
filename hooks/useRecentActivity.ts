"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export interface SolanaTransaction {
  signature: string;
  blockTime: number | null;
  slot: number;
  fee: number;
  status: "success" | "failed";
  /** Change in lamports for the user's account (positive = received, negative = sent) */
  lamportDelta: number;
  /** Human-readable direction */
  direction: "sent" | "received" | "other";
  /** Amount in SOL */
  amountSol: number;
}

export function useRecentActivity(limit = 10) {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [transactions, setTransactions] = useState<SolanaTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchActivity = useCallback(async () => {
    if (!publicKey) {
      if (isMounted.current) setTransactions([]);
      return;
    }
    if (isMounted.current) setIsLoading(true);
    if (isMounted.current) setError(null);
    try {
      // Get recent transaction signatures
      const signatures = await connection.getSignaturesForAddress(publicKey, {
        limit,
      });

      if (signatures.length === 0) {
        if (isMounted.current) setTransactions([]);
        return;
      }

      // Fetch transaction details with fallback in case of rate limits
      let txDetails: any[] = [];
      try {
        txDetails = await connection.getParsedTransactions(
          signatures.map((s) => s.signature),
          { maxSupportedTransactionVersion: 0 }
        ) ?? [];
      } catch (err) {
        console.warn("[useRecentActivity] getParsedTransactions failed, falling back:", err);
      }

      const parsed: SolanaTransaction[] = signatures.map((sig, i) => {
        const tx = txDetails?.[i];
        let lamportDelta = 0;
        let direction: "sent" | "received" | "other" = "other";
        let amountSol = 0;

        if (tx?.meta) {
          const preBalances = tx.meta.preBalances;
          const postBalances = tx.meta.postBalances;
          const accountKeys = tx.transaction.message.accountKeys;

          // Find the user's account index
          const userIdx = accountKeys.findIndex(
            (k: any) => {
              const pubkeyStr = typeof k.pubkey === "string" ? k.pubkey : k.pubkey?.toBase58?.() || "";
              return pubkeyStr === publicKey.toBase58();
            }
          );

          if (userIdx !== -1) {
            lamportDelta = postBalances[userIdx] - preBalances[userIdx];
            amountSol = Math.abs(lamportDelta) / LAMPORTS_PER_SOL;
            if (lamportDelta > 0) direction = "received";
            else if (lamportDelta < 0) direction = "sent";
          }
        }

        return {
          signature: sig.signature,
          blockTime: sig.blockTime ?? null,
          slot: sig.slot,
          fee: tx?.meta?.fee ?? 0,
          status: sig.err ? "failed" : "success",
          lamportDelta,
          direction,
          amountSol,
        };
      });

      if (isMounted.current) setTransactions(parsed);
    } catch (e) {
      console.warn("Failed to fetch activity:", e);
      if (isMounted.current) setError("Failed to load activity");
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [publicKey, connection, limit]);

  useEffect(() => {
    isMounted.current = true;
    fetchActivity();
    return () => { isMounted.current = false; };
  }, [fetchActivity, connected]);

  return { transactions, isLoading, error, refetch: fetchActivity };
}
