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

function generateMockSignature() {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 88; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET() {
  try {
    const payments = getScheduledPayments();
    return NextResponse.json({ agents: payments.map(serializePayment) });
  } catch (e: any) {
    console.error("[/api/agents GET]", e);
    return NextResponse.json({ agents: [], error: e.message }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      from,
      to,
      amount,
      token,
      interval,
      description,
      initialDeposit,
      initialTokenDeposit,
      endDate,
    } = body;

    const payments = getScheduledPayments();
    
    const newPayment = {
      id: BigInt(Date.now()), // unique id
      from: from || null,
      to: to || null,
      amount: BigInt(amount || "0"),
      token: token || "",
      nextExecution: BigInt(Math.floor(Date.now() / 1000) + Number(interval || "0")),
      interval: BigInt(interval || "0"),
      isActive: true,
      description: description || "",
      balance: BigInt(initialDeposit || "0"),
      tokenBalance: BigInt(initialTokenDeposit || "0"),
      endDate: BigInt(endDate || "0"),
    };

    payments.push(newPayment);
    saveScheduledPayments(payments);

    const mockSignature = generateMockSignature();

    return NextResponse.json({
      success: true,
      txSignature: mockSignature,
      result: serializePayment(newPayment)
    });
  } catch (e: any) {
    console.error("[/api/agents POST]", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
