"use client";

import { Badge } from "@/components/ui/badge";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Wifi, WifiOff } from "lucide-react";

export function NetworkBadge() {
    const { connection } = useConnection();
    const { connected } = useWallet();

    if (!connected) {
        return (
            <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                <WifiOff className="size-3" />
                <span className="hidden sm:inline">Not Connected</span>
            </Badge>
        );
    }

    const endpoint = connection.rpcEndpoint;
    const isMainnet = endpoint.includes("mainnet");

    return (
        <Badge variant="outline" className={`gap-1.5 ${isMainnet ? "bg-green-500/10 text-green-500 border-green-500/30" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"}`}>
            <Wifi className="size-3" />
            <span className="hidden sm:inline">{isMainnet ? "Solana Mainnet" : "Solana Devnet"}</span>
            <span className="sm:hidden">{isMainnet ? "SOL" : "DEV"}</span>
        </Badge>
    );
}
