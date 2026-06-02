"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export function usePayInvoice() {
    const [isPending, setIsPending] = useState(false);

    const payInvoice = useCallback(async (invoiceId: bigint, amount: bigint): Promise<boolean> => {
        setIsPending(true);
        try {
            // Payment is handled by the autonomous worker (scripts/worker.ts) server-side.
            // SOLANA_PRIVATE_KEY must never be decoded in the browser.
            toast.info("Payment queued — the autonomous worker will settle this on the next cycle.");
            return true;
        } catch (e) {
            console.error("Pay invoice error:", e);
            return false;
        } finally {
            setIsPending(false);
        }
    }, []);

    return {
        payInvoice,
        hash: null as string | null,
        isPending,
        isSuccess: false,
        error: null,
        resetState: () => setIsPending(false),
    };
}
