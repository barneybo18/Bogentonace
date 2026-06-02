"use client";

import { useState } from "react";

export function useInvoices() {
    return { invoices: [] as any[], isLoading: false, refetch: () => {} };
}

export function useInvoice(id: bigint | undefined) {
    return { invoice: undefined as any, isLoading: false, refetch: () => {} };
}
