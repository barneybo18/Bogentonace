"use client";

import { useState } from "react";

export function useAgentStats() {
    return { stats: null, isLoading: false, refetch: () => {} };
}
