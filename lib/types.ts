// lib/types.ts
// Solana-native type definitions and formatting helpers.
// Import from here — never from lib/contracts.ts or lib/mantle.ts.

export interface Invoice {
  id: bigint
  creator: string | null        // base58 Solana pubkey
  recipient: string | null      // base58 Solana pubkey
  amount: bigint                // lamports (SOL) or USDC units (6 dec)
  token: string                 // SPL mint address
  metadataHash: string
  paid: boolean
  dueDate: bigint               // Unix timestamp seconds
  createdAt: bigint             // Unix timestamp seconds
}

export interface ScheduledPayment {
  id: bigint
  from: string | null
  to: string | null
  amount: bigint
  token: string
  nextExecution: bigint
  interval: bigint              // seconds between payments
  isActive: boolean
  description: string
  balance: bigint               // remaining lamports
  tokenBalance: bigint
  endDate: bigint               // 0 = no end date
}

export interface UserStats {
  createdCount: bigint
  receivedCount: bigint
  totalPaid: bigint
  totalReceived: bigint
  scheduledCount: bigint
}

export interface AgentRecord {
  id: string                    // SAP agent ID (base58)
  name: string
  description: string
  isActive: boolean
  balance: bigint
  network: "mainnet" | "devnet"
}

export const SOL_MINT = "So11111111111111111111111111111111111111112"
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
export const NATIVE_TOKEN = SOL_MINT

export const SUPPORTED_TOKENS = [
  {
    symbol: "SOL",
    name: "Solana",
    address: SOL_MINT,
    decimals: 9,
    logo: "https://cryptologos.cc/logos/solana-sol-logo.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: USDC_MINT,
    decimals: 6,
    logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
  },
] as const

export const formatLamports = (lamports: bigint | number): string =>
  (Number(lamports) / 1e9).toFixed(4)

export const parseSol = (sol: string): bigint =>
  BigInt(Math.round(parseFloat(sol || "0") * 1e9))

export const formatUsdc = (units: bigint | number): string =>
  (Number(units) / 1e6).toFixed(2)

export const parseUsdc = (usdc: string): bigint =>
  BigInt(Math.round(parseFloat(usdc || "0") * 1e6))

export const formatTokenAmount = (amount: bigint | number, decimals: number): string =>
  (Number(amount) / Math.pow(10, decimals)).toFixed(decimals === 9 ? 4 : 2)

export const parseTokenAmount = (value: string, decimals: number): bigint =>
  BigInt(Math.round(parseFloat(value || "0") * Math.pow(10, decimals)))

export const getTokenSymbol = (mintAddress: string): string => {
  const token = SUPPORTED_TOKENS.find(t => t.address === mintAddress)
  return token?.symbol ?? "SOL"
}

export const getTokenDecimals = (mintAddress: string): number => {
  const token = SUPPORTED_TOKENS.find(t => t.address === mintAddress)
  return token?.decimals ?? 9
}
