"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, FileText, Bot, ArrowUpRight, ArrowDownLeft, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useUserStats } from "@/hooks/useUserStats";
import { useInvoices } from "@/hooks/useInvoices";
import { useAgents } from "@/hooks/useAgents";
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

export default function DashboardPage() {
    const { isConnected, address } = useAccount();
    const chainId = 1;
    const { balanceFormatted, totalReceivedFormatted, invoiceCount, isLoading: statsLoading } = useUserStats();
    const { invoices, isLoading: invoicesLoading, refetch } = useInvoices();
    const { agents, isLoading: agentsLoading } = useAgents();
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

    // Calculate visible agent count using same logic as agents page
    // Filter out cancelled/deleted agents (isActive=false AND no balance)
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
        inv => inv.paid && inv.recipient.toLowerCase() === address?.toLowerCase()
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

    const isLoading = statsLoading || invoicesLoading || agentsLoading;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
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
                        {/* Total Received - Clickable */}
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
                                <div className="text-2xl font-bold">{totalReceivedFormatted}</div>
                                <p className="text-xs text-muted-foreground">Click to view details →</p>
                            </CardContent>
                        </Card>

                        {/* Pending Invoices - Clickable */}
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

                        {/* Scheduled Agents - Link to agents page */}
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

                        {/* Wallet Balance - Clickable */}
                        <Card
                            className="relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                            onClick={() => setWalletSheetOpen(true)}
                        >
                            <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-transparent" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                                <img src="https://cryptologos.cc/logos/mantle-mnt-logo.png?v=035" alt="MNT" className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{balanceFormatted}</div>
                                <p className="text-xs text-muted-foreground truncate">{address?.slice(0, 10)}...</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Invoices</CardTitle>
                        <CardDescription>
                            {invoices.length} total invoices
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AnimatePresence mode="wait">
                            {invoicesLoading ? (
                                <motion.div
                                    key="skeleton"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    {[...Array(3)].map((_, i) => (
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
                            ) : recentInvoices.length === 0 ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    <Image
                                        src="/bogent-empty.png"
                                        alt="No invoices"
                                        width={100}
                                        height={100}
                                        className="mx-auto mb-2"
                                    />
                                    <p>No invoices yet</p>
                                    <Button asChild className="mt-4" variant="outline">
                                        <Link href="/invoices/new">Create your first invoice</Link>
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="content"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4"
                                >
                                    {recentInvoices.map((invoice, idx) => (
                                        <motion.div
                                            key={invoice.id.toString()}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0 cursor-pointer hover:bg-muted/50 rounded-md p-2 -mx-2 transition-colors"
                                            onClick={() => setSelectedInvoice(invoice)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`size-9 rounded-full flex items-center justify-center ${invoice.creator.toLowerCase() === address?.toLowerCase()
                                                    ? 'bg-green-500/10'
                                                    : 'bg-blue-500/10'
                                                    }`}>
                                                    {invoice.creator.toLowerCase() === address?.toLowerCase() ? (
                                                        <ArrowUpRight className="size-5 text-green-500" />
                                                    ) : (
                                                        <ArrowDownLeft className="size-5 text-blue-500" />
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none">
                                                        {invoice.creator.toLowerCase() === address?.toLowerCase() ? 'Invoice Sent' : 'Invoice Received'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {invoice.creator.toLowerCase() === address?.toLowerCase()
                                                            ? `to ${invoice.recipient.slice(0, 6)}...${invoice.recipient.slice(-4)}`
                                                            : `from ${invoice.creator.slice(0, 6)}...${invoice.creator.slice(-4)}`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{formatLamports(invoice.amount)} SOL</div>
                                                <div className={`text-xs ${invoice.paid ? 'text-green-500' : 'text-yellow-500'}`}>
                                                    {invoice.paid ? 'Paid' : 'Pending'}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>

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
                    </CardContent>
                </Card>
            </div>

            {/* Total Received Sheet */}
            <StatDetailSheet
                isOpen={receivedSheetOpen}
                onClose={() => setReceivedSheetOpen(false)}
                title="Payments Received"
                description={`${receivedPaidInvoices.length} paid invoices • ${totalReceivedFormatted}`}
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
                                        From {invoice.creator.slice(0, 6)}...{invoice.creator.slice(-4)}
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
                            const isCreator = invoice.creator.toLowerCase() === address?.toLowerCase();
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
                                                ? `${invoice.recipient.slice(0, 6)}...${invoice.recipient.slice(-4)}`
                                                : `${invoice.creator.slice(0, 6)}...${invoice.creator.slice(-4)}`
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
                        <p className="text-xs text-muted-foreground mb-2">Balance</p>
                        <p className="text-3xl font-bold">{balanceFormatted}</p>
                    </div>

                    <Button asChild className="w-full" variant="outline">
                        <a
                            href={address ? `https://explorer.solana.com/address/${address}` : '#'}
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

