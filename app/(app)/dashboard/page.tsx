"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, FileText, Bot, ArrowUpRight, ArrowDownLeft, Copy, Check, ExternalLink, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useUserStats } from "@/hooks/useUserStats";
import { useInvoices } from "@/hooks/useInvoices";
import { useAgents } from "@/hooks/useAgents";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { useState } from "react";
import { formatLamports } from "@/lib/types";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { StatCardsGridSkeleton } from "@/components/StatCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { StatDetailSheet } from "@/components/StatDetailSheet";
import { InvoiceDetailModal } from "@/components/InvoiceDetailModal";
import { Invoice } from "@/lib/types";
import { usePayInvoice } from "@/hooks/usePayInvoice";
import { useCancelInvoice } from "@/hooks/useCancelInvoice";
import { useAccount } from "@/hooks/useAccount";
import { useNetwork } from "@/components/NetworkProvider";
import { Badge } from "@/components/ui/badge";

function formatTime(blockTime: number | null) {
    if (!blockTime) return "–";
    const d = new Date(blockTime * 1000);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
    const { isConnected, address } = useAccount();
    const { network, isMainnet } = useNetwork();
    const { balanceFormatted, isLoading: statsLoading } = useUserStats();
    const { invoices, isLoading: invoicesLoading, refetch } = useInvoices();
    const { agents, isLoading: agentsLoading } = useAgents();
    const { transactions, isLoading: activityLoading, refetch: refetchActivity } = useRecentActivity(10);
    const { payInvoice, isPending: paying } = usePayInvoice();
    const { cancelInvoice, isPending: cancelling } = useCancelInvoice();

    // Sheet visibility state
    const [receivedSheetOpen, setReceivedSheetOpen] = useState(false);
    const [pendingSheetOpen, setPendingSheetOpen] = useState(false);
    const [walletSheetOpen, setWalletSheetOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [payingId, setPayingId] = useState<bigint | null>(null);
    const [cancellingId, setCancellingId] = useState<bigint | null>(null);

    // Calculate visible agent count
    const isCancelled = (a: typeof agents[0]) => !a.isActive && a.balance === 0n && a.tokenBalance === 0n;
    const visibleAgentCount = agents.filter(a => !isCancelled(a)).length;

    // Get recent invoices (last 5)
    const recentInvoices = invoices
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
        .slice(0, 5);

    // Get pending (unpaid) invoices
    const pendingInvoices = invoices.filter(inv => !inv.paid);
    const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0n);

    // Get paid invoices where user is recipient (received payments)
    const receivedPaidInvoices = invoices.filter(
        inv => inv.paid && inv.recipient?.toLowerCase() === address?.toLowerCase()
    );

    const handlePay = async (invoiceId: bigint, amount: bigint) => {
        setPayingId(invoiceId);
        try {
            await payInvoice(invoiceId, amount);
            setTimeout(() => {
                refetch();
                setPayingId(null);
                setSelectedInvoice(null);
            }, 2000);
        } catch (e) {
            setPayingId(null);
        }
    };

    const handleCancel = async (invoiceId: bigint) => {
        setCancellingId(invoiceId);
        try {
            await cancelInvoice(invoiceId);
            setTimeout(() => {
                refetch();
                setCancellingId(null);
                setSelectedInvoice(null);
            }, 2000);
        } catch (e) {
            setCancellingId(null);
        }
    };

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        }
    };

    const explorerBase = isMainnet
        ? "https://explorer.solana.com"
        : "https://explorer.solana.com?cluster=devnet";

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Welcome to Bogent</h2>
                    <p className="text-muted-foreground">Connect your wallet to get started</p>
                </div>
                <WalletMultiButton />
            </div>
        );
    }

    // Only show grid skeleton when invoices/agents are loading on first mount.
    // Balance (statsLoading) gets its own inline skeleton so the grid doesn't flicker.
    const isLoading = invoicesLoading || agentsLoading;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
                    <Badge
                        variant="outline"
                        className={`text-xs ${isMainnet
                            ? "bg-green-500/10 text-green-500 border-green-500/30"
                            : "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                            }`}
                    >
                        {isMainnet ? "Mainnet" : "Devnet"}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild size="sm" className="sm:size-default">
                        <Link href="/invoices/new">Create Invoice</Link>
                    </Button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <StatCardsGridSkeleton />
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                    >
                        {/* Total Received */}
                        <Card
                            className="relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                            onClick={() => setReceivedSheetOpen(true)}
                        >
                            <div className="absolute inset-0 bg-linear-to-br from-green-500/5 to-transparent" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Received</CardTitle>
                                <DollarSign className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{receivedPaidInvoices.length > 0 ? formatLamports(receivedPaidInvoices.reduce((s, i) => s + i.amount, 0n)) + " SOL" : "0.0000 SOL"}</div>
                                <p className="text-xs text-muted-foreground">Click to view details →</p>
                            </CardContent>
                        </Card>

                        {/* Pending Invoices */}
                        <Card
                            className="relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                            onClick={() => setPendingSheetOpen(true)}
                        >
                            <div className="absolute inset-0 bg-linear-to-br from-yellow-500/5 to-transparent" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                                <FileText className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{pendingInvoices.length}</div>
                                <p className="text-xs text-muted-foreground">
                                    Worth ~{formatLamports(pendingTotal)} SOL
                                </p>
                            </CardContent>
                        </Card>

                        {/* Scheduled Agents */}
                        <Link href="/agents">
                            <Card className="relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all h-full">
                                <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 to-transparent" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Scheduled Agents</CardTitle>
                                    <Bot className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{visibleAgentCount}</div>
                                    <p className="text-xs text-muted-foreground">Click to manage →</p>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Wallet Balance - real SOL balance */}
                        <Card
                            className="relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                            onClick={() => setWalletSheetOpen(true)}
                        >
                            <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-transparent" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                                <img
                                    src="https://cryptologos.cc/logos/solana-sol-logo.png?v=035"
                                    alt="SOL"
                                    className="h-4 w-4"
                                />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{statsLoading ? <Skeleton className="h-8 w-28" /> : balanceFormatted}</div>
                                <p className="text-xs text-muted-foreground truncate">{address?.slice(0, 10)}...</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                {/* Recent On-Chain Activity */}
                <Card className="lg:col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="size-4 text-primary" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription>
                                On-chain transactions for your wallet
                            </CardDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0"
                            onClick={refetchActivity}
                            disabled={activityLoading}
                        >
                            <RefreshCw className={`size-4 ${activityLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <AnimatePresence mode="wait">
                            {activityLoading ? (
                                <motion.div
                                    key="skeleton"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center justify-between pb-2">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="size-9 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                            </div>
                                            <div className="text-right space-y-2">
                                                <Skeleton className="h-4 w-16" />
                                                <Skeleton className="h-3 w-12" />
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : transactions.length === 0 ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    <Activity className="size-10 mx-auto mb-2 opacity-30" />
                                    <p>No transactions found</p>
                                    <p className="text-xs mt-1">
                                        {isMainnet ? "Mainnet" : "Devnet"} — transactions will appear here
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="content"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-1"
                                >
                                    {transactions.map((tx, idx) => (
                                        <motion.a
                                            key={tx.signature}
                                            href={`${explorerBase}/tx/${tx.signature}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.04 }}
                                            className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0 cursor-pointer hover:bg-muted/50 rounded-md p-2 -mx-2 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`size-9 rounded-full flex items-center justify-center shrink-0 ${tx.direction === "received"
                                                    ? "bg-green-500/10"
                                                    : tx.direction === "sent"
                                                        ? "bg-red-500/10"
                                                        : "bg-muted"
                                                    }`}>
                                                    {tx.direction === "received" ? (
                                                        <ArrowDownLeft className="size-5 text-green-500" />
                                                    ) : tx.direction === "sent" ? (
                                                        <ArrowUpRight className="size-5 text-red-400" />
                                                    ) : (
                                                        <Activity className="size-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="space-y-0.5 min-w-0">
                                                    <p className="text-sm font-medium leading-none capitalize">
                                                        {tx.direction === "other" ? "Transaction" : tx.direction}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatTime(tx.blockTime)}
                                                    </p>
                                                    <p className="text-xs font-mono text-muted-foreground/60 truncate max-w-[140px]">
                                                        {tx.signature.slice(0, 8)}...{tx.signature.slice(-4)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                {tx.amountSol > 0 && (
                                                    <div className={`font-medium text-sm ${tx.direction === "received"
                                                        ? "text-green-500"
                                                        : tx.direction === "sent"
                                                            ? "text-red-400"
                                                            : "text-foreground"
                                                        }`}>
                                                        {tx.direction === "received" ? "+" : tx.direction === "sent" ? "-" : ""}
                                                        {tx.amountSol.toFixed(4)} SOL
                                                    </div>
                                                )}
                                                <div className={`text-xs mt-0.5 ${tx.status === "success" ? "text-green-500/70" : "text-red-400"}`}>
                                                    {tx.status}
                                                </div>
                                                <ExternalLink className="size-3 text-muted-foreground/40 mt-0.5 ml-auto group-hover:text-muted-foreground transition-colors" />
                                            </div>
                                        </motion.a>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Manage your payments
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button asChild className="w-full justify-start" variant="outline">
                            <Link href="/invoices/new">
                                <FileText className="mr-2 size-4" /> Create New Invoice
                            </Link>
                        </Button>
                        <Button asChild className="w-full justify-start" variant="outline">
                            <Link href="/invoices">
                                <DollarSign className="mr-2 size-4" /> View All Invoices
                            </Link>
                        </Button>
                        <Button asChild className="w-full justify-start" variant="outline">
                            <Link href="/agents">
                                <Bot className="mr-2 size-4" /> Configure Agents
                            </Link>
                        </Button>
                        {/* Explorer link */}
                        {address && (
                            <Button asChild className="w-full justify-start" variant="outline">
                                <a
                                    href={`${explorerBase}/address/${address}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <ExternalLink className="mr-2 size-4" /> View on Explorer
                                </a>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Total Received Sheet */}
            <StatDetailSheet
                isOpen={receivedSheetOpen}
                onClose={() => setReceivedSheetOpen(false)}
                title="Payments Received"
                description={`${receivedPaidInvoices.length} paid invoices`}
            >
                {receivedPaidInvoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Image
                            src="/bogent-empty.png"
                            alt="No payments"
                            width={100}
                            height={100}
                            className="mx-auto mb-2"
                        />
                        <p>No payments received yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {receivedPaidInvoices.map((invoice) => (
                            <div
                                key={invoice.id.toString()}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => {
                                    setReceivedSheetOpen(false);
                                    setSelectedInvoice(invoice);
                                }}
                            >
                                <div className="space-y-1">
                                    <p className="font-medium text-sm">
                                        From {invoice.creator?.slice(0, 6)}...{invoice.creator?.slice(-4)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(Number(invoice.createdAt) * 1000).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-500">+{formatLamports(invoice.amount)} SOL</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </StatDetailSheet>

            {/* Pending Invoices Sheet */}
            <StatDetailSheet
                isOpen={pendingSheetOpen}
                onClose={() => setPendingSheetOpen(false)}
                title="Pending Invoices"
                description={`${pendingInvoices.length} awaiting payment • ~${formatLamports(pendingTotal)} SOL`}
            >
                {pendingInvoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Image
                            src="/bogent-empty.png"
                            alt="No pending invoices"
                            width={100}
                            height={100}
                            className="mx-auto mb-2"
                        />
                        <p>No pending invoices</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingInvoices.map((invoice) => {
                            const isCreator = invoice.creator?.toLowerCase() === address?.toLowerCase();
                            return (
                                <div
                                    key={invoice.id.toString()}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => {
                                        setPendingSheetOpen(false);
                                        setSelectedInvoice(invoice);
                                    }}
                                >
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm">
                                            {isCreator ? 'Sent to' : 'From'} {isCreator
                                                ? `${invoice.recipient?.slice(0, 6)}...${invoice.recipient?.slice(-4)}`
                                                : `${invoice.creator?.slice(0, 6)}...${invoice.creator?.slice(-4)}`
                                            }
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Due: {new Date(Number(invoice.dueDate) * 1000).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{formatLamports(invoice.amount)} SOL</p>
                                        <p className="text-xs text-yellow-500">Pending</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </StatDetailSheet>

            {/* Wallet Balance Sheet */}
            <StatDetailSheet
                isOpen={walletSheetOpen}
                onClose={() => setWalletSheetOpen(false)}
                title="Wallet Details"
                description={balanceFormatted}
            >
                <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Your Address</p>
                        <div className="flex items-center gap-2">
                            <p className="font-mono text-sm truncate flex-1">{address}</p>
                            <Button variant="ghost" size="icon" onClick={copyAddress}>
                                {copiedAddress ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">SOL Balance</p>
                        <p className="text-3xl font-bold">{balanceFormatted}</p>
                    </div>

                    <div className="p-3 border rounded-lg flex items-center gap-2">
                        <span className={`size-2 rounded-full ${isMainnet ? "bg-green-500" : "bg-yellow-500"}`} />
                        <span className="text-sm text-muted-foreground">
                            Connected to <strong>{isMainnet ? "Mainnet" : "Devnet"}</strong>
                        </span>
                    </div>

                    <Button asChild className="w-full" variant="outline">
                        <a
                            href={address ? `${explorerBase}/address/${address}` : '#'}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View on Solana Explorer
                        </a>
                    </Button>
                </div>
            </StatDetailSheet>

            {/* Invoice Detail Modal */}
            <InvoiceDetailModal
                invoice={selectedInvoice}
                isOpen={!!selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                userAddress={address || undefined}
                onPay={handlePay}
                onCancel={handleCancel}
                isPaying={paying && payingId === selectedInvoice?.id}
                isCancelling={cancellingId === selectedInvoice?.id}
            />
        </div>
    );
}
