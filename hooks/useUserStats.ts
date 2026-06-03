"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function useUserStats() {
    const { publicKey, connected } = useWallet();
    const { connection } = useConnection();
    const [balance, setBalance] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const isMounted = useRef(true);

    const fetchBalance = useCallback(async () => {
        if (!publicKey) {
            if (isMounted.current) setBalance(0);
            return;
        }
        if (isMounted.current) setIsLoading(true);
        try {
            const lamports = await connection.getBalance(publicKey, "confirmed");
            if (isMounted.current) setBalance(lamports);
        } catch (e) {
            console.warn("[useUserStats] getBalance failed:", e);
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    }, [publicKey, connection]);

    // Fetch whenever wallet connects or connection changes
    useEffect(() => {
        isMounted.current = true;
        fetchBalance();
        return () => {
            isMounted.current = false;
        };
    }, [fetchBalance, connected]);

    // Poll every 15 seconds while connected to catch incoming transfers
    useEffect(() => {
        if (!connected || !publicKey) return;
        const interval = setInterval(fetchBalance, 15_000);
        return () => clearInterval(interval);
    }, [fetchBalance, connected, publicKey]);

    const balanceInSol = balance / LAMPORTS_PER_SOL;
    const balanceFormatted = connected
        ? `${balanceInSol.toFixed(4)} SOL`
        : "–";

    return {
        stats: {
            balance: BigInt(Math.floor(balance)),
            totalReceived: 0n,
            invoiceCount: 0n,
        },
        balanceFormatted,
        totalReceivedFormatted: "0.0 SOL",
        invoiceCount: 0n,
        isLoading,
        refetch: fetchBalance,
    };
}
