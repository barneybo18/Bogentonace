"use client";

import { useState } from "react";

export function useCancelInvoice() {
    const [isPending, setIsPending] = useState(false);
    return { cancelInvoice: async (...args: any[]) => true, isPending, hash: "dummy", isSuccess: false, error: null, resetState: () => {} };
}
