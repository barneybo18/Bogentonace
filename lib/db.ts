import fs from "fs";
import path from "path";
import { ScheduledPayment } from "./types";

const DB_PATH = path.join(process.cwd(), "cache", "scheduled_payments.json");

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]));
  }
}

export function getScheduledPayments(): ScheduledPayment[] {
  ensureDb();
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(data);
    return parsed.map((p: any) => ({
      ...p,
      id: BigInt(p.id),
      amount: BigInt(p.amount),
      balance: BigInt(p.balance),
      tokenBalance: BigInt(p.tokenBalance),
      interval: BigInt(p.interval),
      nextExecution: BigInt(p.nextExecution),
      endDate: BigInt(p.endDate),
    }));
  } catch (e) {
    console.error("Failed to read scheduled payments db", e);
    return [];
  }
}

export function saveScheduledPayments(payments: ScheduledPayment[]) {
  ensureDb();
  const serialized = payments.map((p) => ({
    ...p,
    id: p.id.toString(),
    amount: p.amount.toString(),
    balance: p.balance.toString(),
    tokenBalance: p.tokenBalance.toString(),
    interval: p.interval.toString(),
    nextExecution: p.nextExecution.toString(),
    endDate: p.endDate.toString(),
  }));
  fs.writeFileSync(DB_PATH, JSON.stringify(serialized, null, 2));
}

const HISTORY_PATH = path.join(process.cwd(), "cache", "agent_history.json");

export interface AgentHistoryEvent {
  agentId: string;
  transactionHash: string;
  amount: string;
  timestamp: string;
}

function ensureHistoryDb() {
  const dir = path.dirname(HISTORY_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_PATH)) {
    fs.writeFileSync(HISTORY_PATH, JSON.stringify([]));
  }
}

export function getAgentHistory(agentId: string): AgentHistoryEvent[] {
  ensureHistoryDb();
  try {
    const data = fs.readFileSync(HISTORY_PATH, "utf-8");
    const parsed = JSON.parse(data);
    return parsed.filter((e: AgentHistoryEvent) => e.agentId === agentId);
  } catch (e) {
    console.error("Failed to read agent history db", e);
    return [];
  }
}

export function saveAgentHistoryEvent(event: AgentHistoryEvent) {
  ensureHistoryDb();
  try {
    const data = fs.readFileSync(HISTORY_PATH, "utf-8");
    const parsed = JSON.parse(data);
    parsed.push(event);
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.error("Failed to save agent history event", e);
  }
}
