import { getScheduledPayments, saveScheduledPayments } from "@/lib/db";
import { NextResponse } from "next/server";

// Helper to serialize bigints
const serializePayment = (p: any) => ({
  ...p,
  id: p.id.toString(),
  amount: p.amount.toString(),
  balance: p.balance.toString(),
  tokenBalance: p.tokenBalance.toString(),
  interval: p.interval.toString(),
  nextExecution: p.nextExecution.toString(),
  endDate: p.endDate.toString(),
});

export async function GET() {
  try {
    const payments = getScheduledPayments();
    return NextResponse.json({ payments: payments.map(serializePayment) });
  } catch (e: any) {
    console.error("[/api/scheduled-payments GET]", e);
    return NextResponse.json({ payments: [], error: e.message }, { status: 200 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const payments = getScheduledPayments();
    const filtered = payments.filter(p => p.id.toString() !== String(id));
    saveScheduledPayments(filtered);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[/api/scheduled-payments DELETE]", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
