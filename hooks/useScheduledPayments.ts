"use client";

import { useState, useCallback, useEffect } from "react";
import { getSAPClient } from "@/lib/sapClient";

export function useScheduledPayments() {
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getSAPClient().getScheduledPayments();
            setPayments(data || []);
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
    return { createScheduledPayment, hash: "dummy", isPending, isSuccess: false, error: null };
}

export function useCancelScheduledPayment() {
    const [isPending, setIsPending] = useState(false);
    const cancelPayment = async (id: bigint) => {
        setIsPending(true);
        try {
            await getSAPClient().cancelAgent();
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
