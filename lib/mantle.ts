// Mantle Network Utilities

export const MANTLE_CHAINS = {
    5000: {
        name: "Mantle",
        explorer: "https://mantlescan.xyz",
        faucet: null,
        isTestnet: false,
    },
    5003: {
        name: "Mantle Sepolia",
        explorer: "https://sepolia.mantlescan.xyz",
        faucet: "https://faucet.sepolia.mantle.xyz",
        isTestnet: true,
    }
} as const;

export function getExplorerUrl(chainId: number, txHash: string): string {
    const chain = MANTLE_CHAINS[chainId as keyof typeof MANTLE_CHAINS];
    if (!chain) return `https://sepolia.mantlescan.xyz/tx/${txHash}`;
    return `${chain.explorer}/tx/${txHash}`;
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
    const chain = MANTLE_CHAINS[chainId as keyof typeof MANTLE_CHAINS];
    if (!chain) return `https://sepolia.mantlescan.xyz/address/${address}`;
    return `${chain.explorer}/address/${address}`;
}

export function getChainName(chainId: number): string {
    const chain = MANTLE_CHAINS[chainId as keyof typeof MANTLE_CHAINS];
    return chain?.name || "Unknown Network";
}

export function getFaucetUrl(chainId: number): string | null {
    const chain = MANTLE_CHAINS[chainId as keyof typeof MANTLE_CHAINS];
    return chain?.faucet || null;
}

export function isTestnet(chainId: number): boolean {
    const chain = MANTLE_CHAINS[chainId as keyof typeof MANTLE_CHAINS];
    return chain?.isTestnet || false;
}

// Mantle L2 gas cost estimation (approximate)
// Mantle gas is ~100x cheaper than Ethereum L1
export function estimateL1Savings(gasUsed: bigint, gasPrice: bigint): {
    mantleCost: string;
    ethereumCost: string;
    savingsPercent: string;
} {
    const mantleCost = gasUsed * gasPrice;
    // Ethereum L1 is approximately 100x more expensive
    const ethereumCost = mantleCost * 100n;

    return {
        mantleCost: formatGwei(mantleCost),
        ethereumCost: formatGwei(ethereumCost),
        savingsPercent: "~99%"
    };
}

function formatGwei(wei: bigint): string {
    const gwei = Number(wei) / 1e9;
    if (gwei < 0.001) return "< 0.001 Gwei";
    return `${gwei.toFixed(4)} Gwei`;
}
