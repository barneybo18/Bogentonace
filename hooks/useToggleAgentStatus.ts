"use client";

import { useState, useCallback } from "react";
import { getSAPClient } from "@/lib/sapClient";

export function useToggleAgentStatus() {
    const [isPending, setIsPending] = useState(false);

    const toggleAgentStatus = useCallback(async (id: bigint, isActive: boolean) => {
        setIsPending(true);
        try {
            await getSAPClient().toggleAgent();
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setIsPending(false);
        }
    }, []);

    return { toggleAgentStatus, isPending, hash: "dummy", isSuccess: false, error: null, resetState: () => {} };
}
