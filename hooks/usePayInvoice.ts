"use client";

import { useState, useCallback } from "react";
import { payWithX402 } from "@/lib/x402Client";

export function usePayInvoice() {
    const [isPending, setIsPending] = useState(false);

    const payInvoice = useCallback(async (invoiceId: bigint, amount: bigint): Promise<boolean> => {
        setIsPending(true);
        try {
            await payWithX402({
                serviceUrl: "https://api.acedata.cloud/v1/text/summary",
                amount: Number(amount),
                walletSecret: new Uint8Array() // stub
            });
            return true;
        } catch (e) {
            console.error("Pay invoice error:", e);
            return false;
        } finally {
            setIsPending(false);
        }
    }, []);

    const resetState = useCallback(() => {
        setIsPending(false);
    }, []);

    return {
        payInvoice,
        hash: "dummy-hash",
        isPending,
        isSuccess: false,
        error: null,
        resetState
    };
}
