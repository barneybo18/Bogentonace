"use client";

import { useState, useCallback } from "react";

export function useCreateInvoice() {
    const [isPending, setIsPending] = useState(false);

    const createInvoice = useCallback(async (...args: any[]) => {
        setIsPending(true);
        try {
            // Stubbed for AceDataCloud/SAP
            return { success: true };
        } catch (e) {
            console.error(e);
            return { success: false, error: e };
        } finally {
            setIsPending(false);
        }
    }, []);

    return { createInvoice, isPending, hash: "dummy", isSuccess: false, error: null as any, resetState: () => {} };
}
