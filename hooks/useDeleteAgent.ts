"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram } from "@solana/web3.js";
import { useInvalidateQueries } from "./useInvalidateQueries";

export function useDeleteAgent() {
    const [isPending, setIsPending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<any>(null);
    const [hash, setHash] = useState<string | null>(null);
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const { invalidateAll } = useInvalidateQueries();

    const deleteAgent = useCallback(async (id: bigint | string): Promise<{ success: boolean; error?: string }> => {
        setIsPending(true);
        setError(null);
        setHash(null);
        setIsSuccess(false);
        try {
            if (!publicKey) {
                throw new Error("Wallet not connected. Please connect your wallet first.");
            }

            // Challenge transaction to prompt signature
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: publicKey,
                    lamports: 1000, // 0.000001 SOL challenge
                })
            );

            const latestBlockhash = await connection.getLatestBlockhash("confirmed");
            transaction.recentBlockhash = latestBlockhash.blockhash;
            transaction.feePayer = publicKey;

            const txSignature = await sendTransaction(transaction, connection);

            await connection.confirmTransaction({
                signature: txSignature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            }, "confirmed");

            const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error ?? "Failed to delete agent");
            }

            setHash(txSignature);
            setIsSuccess(true);
            invalidateAll();
            return { success: true };
        } catch (e: any) {
            console.error("Delete agent error:", e);
            const msg = e.message || "Transaction cancelled or failed";
            setError(e);
            return { success: false, error: msg };
        } finally {
            setIsPending(false);
        }
    }, [publicKey, connection, sendTransaction, invalidateAll]);

    const resetState = useCallback(() => {
        setIsPending(false);
        setIsSuccess(false);
        setError(null);
        setHash(null);
    }, []);

    return { deleteAgent, isPending, hash, isSuccess, error, resetState };
}
