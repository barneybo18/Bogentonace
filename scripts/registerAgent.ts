import { registerAgent } from "../lib/sapClient";

async function main() {
  console.log("Registering BOGENT on SAP mainnet...");
  const result = await registerAgent(
    "BOGENT",
    "Autonomous payment agent: discovers tools via SAP, executes AI tasks via AceDataCloud, settles via x402"
  );
  console.log("Agent registered:", result);
  console.log("View on explorer:", `https://explorer.oobeprotocol.ai/agents/${result.agentId}`);
  console.log("Save this to .env as SAP_AGENT_ID=", result.agentId);
}

main().catch(console.error);
