"use client";

import { useState } from "react";

export function useAgentHistory(id?: bigint) {
    return { history: [] as any[], isLoading: false, refetch: () => {} };
}
