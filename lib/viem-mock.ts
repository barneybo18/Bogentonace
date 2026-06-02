export function formatEther(wei: bigint): string {
    if (!wei) return "0";
    // Solana uses 9 decimals for SOL (lamports)
    const sol = Number(wei) / 1e9;
    return sol.toString();
}

export function parseEther(sol: string): bigint {
    if (!sol) return 0n;
    return BigInt(Math.floor(parseFloat(sol) * 1e9));
}

export function formatUnits(value: bigint, decimals: number): string {
    if (!value) return "0";
    const formatted = Number(value) / Math.pow(10, decimals);
    return formatted.toString();
}

export function parseUnits(value: string, decimals: number): bigint {
    if (!value) return 0n;
    return BigInt(Math.floor(parseFloat(value) * Math.pow(10, decimals)));
}
export type Address = string;
