"use client";

import { useState } from "react";

export function useInvoices() {
    return { invoices: [], isLoading: false, refetch: () => {} };
}

export function useInvoice(id: bigint | undefined) {
    return { invoice: undefined, isLoading: false, refetch: () => {} };
}
