"use client";

import { useState, useCallback, useEffect } from "react";

export function useScheduledPayments() {
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/scheduled-payments");
            const data = await res.json();
            const parsed = (data.payments ?? []).map((p: any) => ({
                ...p,
                id: BigInt(p.id),
                amount: BigInt(p.amount),
                balance: BigInt(p.balance),
                tokenBalance: BigInt(p.tokenBalance),
                interval: BigInt(p.interval),
                nextExecution: BigInt(p.nextExecution),
                endDate: BigInt(p.endDate),
            }));
            setPayments(parsed);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return {
        payments,
        activePayments: payments.filter(p => p?.isActive),
        isLoading,
        refetch
    };
}

export function useCreateScheduledPayment() {
    const [isPending, setIsPending] = useState(false);
    const createScheduledPayment = async () => {};
    return { createScheduledPayment, hash: null, isPending, isSuccess: false, error: null };
}

export function useCancelScheduledPayment() {
    const [isPending, setIsPending] = useState(false);

    const cancelPayment = async (id: bigint | string) => {
        setIsPending(true);
        try {
            const res = await fetch("/api/scheduled-payments", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: String(id) }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error ?? "Cancel failed");
        } finally {
            setIsPending(false);
        }
    };

    return { cancelPayment, isPending, isSuccess: false, error: null };
}

export function useExecuteScheduledPayment() {
    const [isPending, setIsPending] = useState(false);
    const executePayment = async (id: bigint) => {};
    return { executePayment, isPending, isSuccess: false, error: null };
}
