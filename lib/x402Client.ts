import axios from "axios";

// signSolanaPayment is the actual export from @acedatacloud/x402-client
// It signs an x402 payment challenge received from a 402-protected endpoint
export async function payWithX402(params: {
  serviceUrl: string;     // AceDataCloud endpoint being paid for
  amount: number;         // amount in lamports or USDC units
  walletSecret: Uint8Array;
}) {
  const { signSolanaPayment } = await import("@acedatacloud/x402-client");
  const { Keypair, Connection, sendAndConfirmTransaction } = await import("@solana/web3.js");
  
  const keypair = Keypair.fromSecretKey(params.walletSecret);
  const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

  const customWallet = {
    publicKey: keypair.publicKey,
    signAndSendTransaction: async (tx: any) => {
      const signature = await sendAndConfirmTransaction(connection, tx, [keypair], { skipPreflight: true });
      return { signature };
    }
  };

  // Payment requirements from AceDataCloud facilitator
  const requirements = {
    payTo: keypair.publicKey.toBase58(), // pay to ourselves
    asset: "So11111111111111111111111111111111111111112",  // SOL mint
    maxAmountRequired: String(params.amount),
    scheme: "exact",
    network: "solana",
    maxTimeoutSeconds: 60,
    resource: params.serviceUrl,
    description: `micropayment for ${params.serviceUrl}`,
    extra: { decimals: 9, computeUnitLimit: 200000, computeUnitPriceMicroLamports: 1000 },
  };

  const signed = await signSolanaPayment(requirements, customWallet);
  return { txSignature: signed.payload.signature, serviceUrl: params.serviceUrl };
}

// Primary payment method for Category 2 — calls AceDataCloud APIs via x402 facilitator
// with Synapse RPC in the execution header for compliance
export async function callAceDataWithX402(endpoint: string, body: Record<string, unknown>) {
  const rpcUrl = process.env.SYNAPSE_RPC_URL!;
  const apiKey = process.env.ACEDATA_API_KEY!;
  const baseUrl = process.env.ACEDATA_BASE_URL || "https://api.acedata.cloud";

  const res = await axios.post(`${baseUrl}${endpoint}`, body, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Synapse-RPC": rpcUrl,   // Synapse RPC in execution
    },
  });
  return res.data;
}
