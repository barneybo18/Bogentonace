"use client";

import { useState } from "react";

export type ArchivedAgent = any;
export type AgentEventType = any;

export function useAgentHistoryLog() {
    return { logs: [] as any[], archivedAgents: [] as any[], error: null as any, isLoading: false, refetch: () => {} };
}
