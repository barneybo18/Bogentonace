"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function CountdownTimer({ targetTimestamp }: { targetTimestamp: bigint }) {
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isOverdue, setIsOverdue] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const diff = Number(targetTimestamp) - now;

            if (diff <= 0) {
                setTimeLeft("Due Now");
                setIsOverdue(true);
            } else {
                setIsOverdue(false);
                const d = Math.floor(diff / 86400);
                const h = Math.floor((diff % 86400) / 3600);
                const m = Math.floor((diff % 3600) / 60);
                const s = diff % 60;

                const parts = [];
                if (d > 0) parts.push(`${d}d`);
                if (h > 0) parts.push(`${h}h`);
                parts.push(`${m}m`);
                parts.push(`${s}s`);

                setTimeLeft(parts.join(" "));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [targetTimestamp]);

    if (!timeLeft) return <span className="animate-pulse">...</span>;

    return (
        <div className={`font-mono font-bold ${isOverdue ? "text-green-500 animate-pulse" : ""}`}>
            {timeLeft}
        </div>
    );
}
