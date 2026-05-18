"use client";

import { useState, useCallback } from "react";
import { getSAPClient } from "@/lib/sapClient";
import { useInvalidateQueries } from "./useInvalidateQueries";

export function useCreateAgent() {
    const [isPending, setIsPending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { invalidateAll } = useInvalidateQueries();

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
        try {
            const client = getSAPClient();
            await client.registerAgent({ name: to, description, network: "mainnet" });
            setIsSuccess(true);
            invalidateAll();
            return { success: true };
        } catch (e: any) {
            setError(e.message);
            return { success: false, error: e.message };
        } finally {
            setIsPending(false);
        }
    }, [invalidateAll]);

    const resetState = useCallback(() => {
        setIsPending(false);
        setIsSuccess(false);
        setError(null);
    }, []);

    return {
        createAgent,
        hash: "dummy-hash",
        isPending,
        isSuccess,
        error,
        simulationError: null,
        resetState
    };
}
