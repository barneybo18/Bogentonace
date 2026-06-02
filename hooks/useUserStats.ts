"use client";

import { useState } from "react";

export function useUserStats() {
    return { 
        stats: {
            balance: 0n,
            totalReceived: 0n,
            invoiceCount: 0n
        },
        balanceFormatted: "0.0",
        totalReceivedFormatted: "0.0",
        invoiceCount: 0n,
        isLoading: false, 
        refetch: () => {} 
    };
}
