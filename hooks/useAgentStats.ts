"use client";

import { useState, useEffect, useCallback } from "react";

export function useAgentStats() {
    const [stats, setStats] = useState<Record<string, bigint> | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/agents/stats");
            const data = await res.json();
            if (res.ok && data.stats) {
                const mapped: Record<string, bigint> = {};
                Object.keys(data.stats).forEach(key => {
                    mapped[key] = BigInt(data.stats[key]);
                });
                setStats(mapped);
            }
        } catch (e) {
            console.error("Failed to fetch agent stats:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, isLoading, refetch: fetchStats };
}
