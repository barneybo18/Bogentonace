import { getAgentHistory } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const history = getAgentHistory(id);
        return NextResponse.json({ history });
    } catch (e: any) {
        console.error("[/api/agents/[id]/history GET]", e);
        return NextResponse.json({ history: [], error: e.message }, { status: 500 });
    }
}
