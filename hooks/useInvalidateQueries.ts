"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Hook to invalidate all contract-related queries after a transaction.
 * This ensures the UI updates immediately after any state-changing transaction.
 */
export function useInvalidateQueries() {
    const queryClient = useQueryClient();

    const invalidateAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["agents"] });
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        queryClient.invalidateQueries({ queryKey: ["scheduledPayments"] });
        queryClient.invalidateQueries({ queryKey: ["userStats"] });
        queryClient.invalidateQueries({ queryKey: ["agentHistory"] });
    }, [queryClient]);

    const invalidateAgents = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["agents"] });
    }, [queryClient]);

    const invalidateInvoices = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
    }, [queryClient]);

    return {
        invalidateAll,
        invalidateAgents,
        invalidateInvoices,
    };
}
