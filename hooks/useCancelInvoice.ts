"use client";

import { useState } from "react";

export function useCancelInvoice() {
    const [isPending, setIsPending] = useState(false);
    return { cancelInvoice: async () => {}, isPending, hash: "dummy", isSuccess: false, error: null, resetState: () => {} };
}
