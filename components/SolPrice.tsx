"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceData {
  price: number;
  change24h: number;
}

async function fetchSolPrice(): Promise<PriceData> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true",
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error("Failed to fetch price");
  const data = await res.json();
  return {
    price: data.solana.usd,
    change24h: data.solana.usd_24h_change,
  };
}

export function SolPrice() {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPrice = async () => {
    try {
      const data = await fetchSolPrice();
      setPriceData(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrice();
    // Refresh every 60 seconds
    const interval = setInterval(loadPrice, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 animate-pulse">
        <div className="h-3 w-14 bg-muted rounded" />
      </div>
    );
  }

  if (!priceData) return null;

  const isPositive = priceData.change24h >= 0;

  return (
    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border/50 text-xs">
      <img
        src="https://cryptologos.cc/logos/solana-sol-logo.png?v=035"
        alt="SOL"
        className="size-3.5 rounded-full"
      />
      <span className="font-semibold text-foreground">
        ${priceData.price.toFixed(2)}
      </span>
      <span
        className={`flex items-center gap-0.5 font-medium ${
          isPositive ? "text-green-500" : "text-red-500"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="size-3" />
        ) : (
          <TrendingDown className="size-3" />
        )}
        {Math.abs(priceData.change24h).toFixed(2)}%
      </span>
    </div>
  );
}
