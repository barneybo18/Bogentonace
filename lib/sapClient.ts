import { SAPClient } from "@oobe/sap-sdk";

let _client: SAPClient | null = null;

export function getSAPClient(): SAPClient {
  if (!_client) {
    _client = new SAPClient({
      rpcUrl: process.env.SYNAPSE_RPC_URL!,
      agentId: process.env.SAP_AGENT_ID!,
    });
  }
  return _client;
}

// Register your agent once (run via scripts/registerAgent.ts)
export async function registerAgent(name: string, description: string) {
  const client = getSAPClient();
  return client.registerAgent({ name, description, network: "mainnet" });
}

// Discover tools from SAP registry
export async function discoverTools(query: string) {
  const client = getSAPClient();
  return client.discoverTools({ query });
}

// Call Synapse Sentinel (required for both categories)
export async function callSentinel(taskDescription: string) {
  const client = getSAPClient();
  return client.callAgent({
    agentId: process.env.SYNAPSE_SENTINEL_AGENT!,
    task: taskDescription,
  });
}
