"use client";

import { useState, useCallback, useEffect } from "react";

export function useAgents() {
    const [agents, setAgents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/agents");
            const data = await res.json();
            const parsed = (data.agents ?? []).map((a: any) => ({
                ...a,
                id: BigInt(a.id),
                amount: BigInt(a.amount),
                balance: BigInt(a.balance),
                tokenBalance: BigInt(a.tokenBalance),
                interval: BigInt(a.interval),
                nextExecution: BigInt(a.nextExecution),
                endDate: BigInt(a.endDate),
            }));
            setAgents(parsed);
        } catch (e) {
            console.error("Failed to fetch agents", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { agents, isLoading, refetch };
}

export function useAgent(id: bigint | undefined) {
    const { agents, isLoading, refetch } = useAgents();
    const agent = agents.find(a => String(a.id) === String(id));
    return { agent, isLoading, refetch };
}
