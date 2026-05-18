import { X402Client } from "@acedatacloud/x402client";
import { getSolanaConnection } from "./solana";

export async function payWithX402(params: {
  serviceUrl: string;     // AceDataCloud endpoint being paid for
  amount: number;         // amount in lamports or USDC units
  walletSecret: Uint8Array;
}) {
  const x402 = new X402Client({
    rpcUrl: process.env.SYNAPSE_RPC_URL!,
    facilitator: "acedata",  // uses AceDataCloud's own facilitator
  });

  return x402.pay({
    url: params.serviceUrl,
    amount: params.amount,
    signerSecret: params.walletSecret,
  });
}
