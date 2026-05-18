"use client";

import { useState } from "react";

export function useUserStats() {
    return { stats: null, isLoading: false, refetch: () => {} };
}
