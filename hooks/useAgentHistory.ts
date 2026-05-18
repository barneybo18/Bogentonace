"use client";

import { useState } from "react";

export function useAgentHistory() {
    return { history: [], isLoading: false, refetch: () => {} };
}
