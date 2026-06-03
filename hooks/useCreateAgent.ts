"use client";

import { useState, useCallback } from "react";
import { useInvalidateQueries } from "./useInvalidateQueries";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, PublicKey } from "@solana/web3.js";

export function useCreateAgent() {
    const [isPending, setIsPending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hash, setHash] = useState<string | null>(null);
    const { invalidateAll } = useInvalidateQueries();
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();

    const createAgent = useCallback(async (
        to: string,
        amount: bigint,
        token: string,
        interval: bigint,
        description: string,
        initialDeposit: bigint,
        initialTokenDeposit: bigint = 0n,
        endDate: bigint = 0n
    ): Promise<{ success: boolean; error?: string }> => {
        setIsPending(true);
        setError(null);
        setHash(null);
        try {
            if (!publicKey) {
                throw new Error("Wallet not connected. Please connect your wallet first.");
            }

            // 1. Build a Solana transaction to prompt wallet signing in the browser
            let recipientPubkey: PublicKey;
            try {
                recipientPubkey = new PublicKey(to);
            } catch (e) {
                throw new Error("Invalid recipient address format.");
            }

            // Transfer the initial SOL deposit, or at least a 1000 lamport (0.000001 SOL) challenge transfer
            // if initial deposit is 0, to prompt the signature.
            const lamports = initialDeposit > 0n ? initialDeposit : 1000n;

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

            // 2. Once transaction is confirmed, call Next.js API route to save schedule
            const res = await fetch("/api/agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    from: publicKey.toBase58(),
                    to,
                    amount: amount.toString(),
                    token,
                    interval: interval.toString(),
                    description,
                    initialDeposit: initialDeposit.toString(),
                    initialTokenDeposit: initialTokenDeposit.toString(),
                    endDate: endDate.toString(),
                    network: "devnet",
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error ?? "Failed to save scheduled payment");
            }
            setHash(txSignature);
            setIsSuccess(true);
            invalidateAll();
            return { success: true };
        } catch (e: any) {
            console.error("Create agent error:", e);
            setError(e.message || "Transaction cancelled or failed");
            return { success: false, error: e.message || "Transaction cancelled or failed" };
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

    return {
        createAgent,
        hash,
        isPending,
        isSuccess,
        error,
        simulationError: null,
        resetState
    };
}
