"use client";

import { useState } from "react";

export function useUpdateAgent() {
    const [isPending, setIsPending] = useState(false);
    return { updateAgent: async () => {}, isPending, hash: "dummy", isSuccess: false, error: null, resetState: () => {} };
}
