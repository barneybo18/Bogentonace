"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import { useInvalidateQueries } from "./useInvalidateQueries";

export function useTopUpAgent() {
    const [isPending, setIsPending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hash, setHash] = useState<string | null>(null);
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const { invalidateAll } = useInvalidateQueries();

    const topUpAgent = useCallback(async (
        id: bigint | string,
        recipientAddress: string,
        topUpAmount: bigint,
        newBalance: bigint,
        newTokenBalance: bigint = 0n
    ): Promise<{ success: boolean; error?: string }> => {
        setIsPending(true);
        setError(null);
        setHash(null);
        setIsSuccess(false);
        try {
            if (!publicKey) {
                throw new Error("Wallet not connected. Please connect your wallet first.");
            }

            let recipientPubkey: PublicKey;
            try {
                recipientPubkey = new PublicKey(recipientAddress);
            } catch (e) {
                throw new Error("Invalid recipient address format.");
            }

            // Transfer topUpAmount (or 1000 lamports challenge if 0)
            const lamports = topUpAmount > 0n ? topUpAmount : 1000n;

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: recipientPubkey,
                    lamports: Number(lamports),
                })
            );

            // Fetch blockhash
            const latestBlockhash = await connection.getLatestBlockhash("confirmed");
            transaction.recentBlockhash = latestBlockhash.blockhash;
            transaction.feePayer = publicKey;

            // Request wallet signature and broadcast transaction
            const txSignature = await sendTransaction(transaction, connection);

            // Await confirmation
            await connection.confirmTransaction({
                signature: txSignature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            }, "confirmed");

            // Update database via API
            const res = await fetch(`/api/agents/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    balance: newBalance.toString(),
                    tokenBalance: newTokenBalance.toString(),
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error ?? "Failed to update agent balance in database.");
            }

            setHash(txSignature);
            setIsSuccess(true);
            invalidateAll();
            return { success: true };
        } catch (e: any) {
            console.error("Top up agent error:", e);
            const msg = e.message || "Transaction cancelled or failed";
            setError(msg);
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

    return { topUpAgent, isPending, hash, isSuccess, error, resetState };
}
