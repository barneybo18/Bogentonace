import { getScheduledPayments, saveScheduledPayments } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const payments = getScheduledPayments();
        const filtered = payments.filter(p => p.id.toString() !== id);
        saveScheduledPayments(filtered);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("[/api/agents/[id] DELETE]", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { isActive, balance, tokenBalance } = body;

        const payments = getScheduledPayments();
        const updated = payments.map(p => {
            if (p.id.toString() === id) {
                const nextP = { ...p };
                if (isActive !== undefined) {
                    nextP.isActive = Boolean(isActive);
                }
                if (balance !== undefined) {
                    nextP.balance = BigInt(balance);
                }
                if (tokenBalance !== undefined) {
                    nextP.tokenBalance = BigInt(tokenBalance);
                }
                return nextP;
            }
            return p;
        });
        saveScheduledPayments(updated);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("[/api/agents/[id] PATCH]", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
