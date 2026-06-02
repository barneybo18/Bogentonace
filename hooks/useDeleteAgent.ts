"use client";

import { useState, useCallback } from "react";
import { getSAPClient } from "@/lib/sapClient";

export function useDeleteAgent() {
    const [isPending, setIsPending] = useState(false);

    const deleteAgent = useCallback(async (id: bigint) => {
        setIsPending(true);
        try {
            await getSAPClient().cancelAgent();
            return { success: true, error: null };
        } catch (e) {
            console.error(e);
            return { success: false, error: (e as Error).message };
        } finally {
            setIsPending(false);
        }
    }, []);

    return { deleteAgent, isPending, hash: "dummy", isSuccess: false, error: null as any, resetState: () => {} };
}
