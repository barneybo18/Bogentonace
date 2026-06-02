"use client";

import { useState } from "react";

export function useUpdateAgent() {
    const [isPending, setIsPending] = useState(false);
    return { updateAgent: async (...args: any[]) => ({ success: true, error: null }), isPending, hash: "dummy", isSuccess: false, error: null as any, resetState: () => {} };
}
