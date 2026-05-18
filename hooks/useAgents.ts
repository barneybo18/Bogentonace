"use client";

import { useState, useCallback, useEffect } from "react";
import { getSAPClient } from "@/lib/sapClient";

export function useAgents() {
    const [agents, setAgents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        try {
            const client = getSAPClient();
            const data = await client.listAgents();
            setAgents(data || []);
        } catch (e) {
            console.error("Failed to fetch agents", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return {
        agents,
        isLoading,
        refetch
    };
}

export function useAgent(id: bigint | undefined) {
    const { agents, isLoading, refetch } = useAgents();
    const agent = agents.find(a => String(a.id) === String(id));
    return {
        agent,
        isLoading,
        refetch
    };
}
