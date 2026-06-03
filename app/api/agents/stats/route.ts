import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const HISTORY_PATH = path.join(process.cwd(), "cache", "agent_history.json");
    if (!fs.existsSync(HISTORY_PATH)) {
      return NextResponse.json({ stats: {} });
    }
    const data = fs.readFileSync(HISTORY_PATH, "utf-8");
    const history = JSON.parse(data);
    
    const stats: Record<string, string> = {};
    for (const event of history) {
      const agentId = event.agentId;
      const current = BigInt(stats[agentId] || "0");
      const addition = BigInt(event.amount);
      stats[agentId] = (current + addition).toString();
    }
    
    return NextResponse.json({ stats });
  } catch (e: any) {
    console.error("[/api/agents/stats GET]", e);
    return NextResponse.json({ stats: {}, error: e.message }, { status: 500 });
  }
}
