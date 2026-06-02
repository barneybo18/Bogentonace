"use client";

import { useState, useCallback } from "react";

export function useTopUpAgent() {
    const [isPending, setIsPending] = useState(false);

    const topUpAgent = useCallback(async (...args: any[]) => {
        setIsPending(true);
        try {
            // Stubbed for Solana SPL transfer
            return { success: true };
        } catch (e) {
            console.error(e);
            return { success: false, error: e };
        } finally {
            setIsPending(false);
        }
    }, []);

    return { topUpAgent, isPending, hash: "dummy", isSuccess: false, error: null, resetState: () => {} };
}
