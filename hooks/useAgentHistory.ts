"use client";

import { useState, useEffect, useCallback } from "react";

export function useAgentHistory(id?: bigint) {
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/agents/${id.toString()}/history`);
            const data = await res.json();
            if (res.ok && data.history) {
                // Map fields to match component expectations
                const mapped = data.history.map((h: any) => ({
                    transactionHash: h.transactionHash,
                    timestamp: BigInt(h.timestamp),
                    amount: BigInt(h.amount),
                }));
                setHistory(mapped);
            }
        } catch (e) {
            console.error("Failed to fetch agent history:", e);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return { history, isLoading, refetch: fetchHistory };
}
