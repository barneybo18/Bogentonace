"use client";

import { useEffect, useState } from "react";

export function ClientDate({ timestamp }: { timestamp: number | bigint }) {
    const [dateString, setDateString] = useState<string>("");

    useEffect(() => {
        const date = new Date(Number(timestamp) * 1000);
        setDateString(date.toLocaleString());
    }, [timestamp]);

    if (!dateString) return <span className="animate-pulse bg-muted rounded h-4 w-24 inline-block" />;

    return <>{dateString}</>;
}
