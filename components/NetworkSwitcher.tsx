"use client";

import { useNetwork } from "@/components/NetworkProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, ChevronDown, RefreshCw } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { SolanaNetwork } from "@/lib/network";
import { useState } from "react";

export function NetworkSwitcher() {
  const { network, setNetwork, isMainnet } = useNetwork();
  const { connected } = useWallet();
  const [switching, setSwitching] = useState(false);

  const handleSwitch = (n: SolanaNetwork) => {
    if (n === network) return;
    setSwitching(true);
    setNetwork(n);
  };

  if (!connected) {
    return (
      <Badge variant="outline" className="gap-1.5 text-muted-foreground cursor-default">
        <WifiOff className="size-3" />
        <span className="hidden sm:inline">Not Connected</span>
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 h-8 text-xs font-medium border transition-all ${
            isMainnet
              ? "bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20"
              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/20"
          }`}
        >
          {switching ? (
            <RefreshCw className="size-3 animate-spin" />
          ) : (
            <Wifi className="size-3" />
          )}
          <span className="hidden sm:inline">
            {isMainnet ? "Mainnet" : "Devnet"}
          </span>
          <span className="sm:hidden">{isMainnet ? "MN" : "DV"}</span>
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Select Network</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleSwitch("mainnet-beta")}
          className={`flex items-center gap-2 cursor-pointer ${network === "mainnet-beta" ? "bg-accent" : ""}`}
        >
          <span className="size-2 rounded-full bg-green-500 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Mainnet</span>
            <span className="text-xs text-muted-foreground">Live network</span>
          </div>
          {network === "mainnet-beta" && (
            <span className="ml-auto text-xs text-green-500">Active</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSwitch("devnet")}
          className={`flex items-center gap-2 cursor-pointer ${network === "devnet" ? "bg-accent" : ""}`}
        >
          <span className="size-2 rounded-full bg-yellow-500 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Devnet</span>
            <span className="text-xs text-muted-foreground">Test network</span>
          </div>
          {network === "devnet" && (
            <span className="ml-auto text-xs text-yellow-500">Active</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
