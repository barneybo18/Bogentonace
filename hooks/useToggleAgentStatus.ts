"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram } from "@solana/web3.js";
import { useInvalidateQueries } from "./useInvalidateQueries";

export function useToggleAgentStatus() {
    const [isPending, setIsPending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<any>(null);
    const [hash, setHash] = useState<string | null>(null);
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const { invalidateAll } = useInvalidateQueries();

    const toggleAgentStatus = useCallback(async (id: bigint | string, isActive: boolean): Promise<boolean> => {
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

            const res = await fetch(`/api/agents/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error ?? "Failed to toggle agent");
            }

            setHash(txSignature);
            setIsSuccess(true);
            invalidateAll();
            return true;
        } catch (e: any) {
            console.error("Toggle agent status error:", e);
            setError(e);
            return false;
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

    return { toggleAgentStatus, isPending, hash, isSuccess, error, resetState };
}
