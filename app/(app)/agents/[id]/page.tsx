"use client";

import { useAgent } from "@/hooks/useAgents";
import { ClientDate } from "@/components/ClientDate";
import { useAgentHistory } from "@/hooks/useAgentHistory";
import { useTopUpAgent } from "@/hooks/useTopUpAgent";
import { useToggleAgentStatus } from "@/hooks/useToggleAgentStatus";
import { useDeleteAgent } from "@/hooks/useDeleteAgent";
import { useCreateAgent } from "@/hooks/useCreateAgent"; // For types/utils if needed, or just standard utils
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Wallet, Clock, Activity, History, Trash2, Bot, Plus, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CountdownTimer } from "@/components/CountdownTimer";
import { RefreshCw } from "lucide-react";
import { formatLamports, formatTokenAmount, getTokenDecimals, parseSol, parseUsdc, parseTokenAmount, SUPPORTED_TOKENS, NATIVE_TOKEN } from "@/lib/types";
import { useState, use, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
const useTokenApproval = (...args: any[]) => ({ allowance: 1000000n, approveToken: async (...args: any[]) => {}, isPending: false });
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getExplorerUrl } from "@/lib/solana";
import { toast } from "sonner";

// Helper to format duration
const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
};

export default function AgentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idParam } = use(params);
    const id = BigInt(idParam);
    const { agent, isLoading: agentLoading } = useAgent(id);
    const { history, isLoading: historyLoading } = useAgentHistory(id);
    const { topUpAgent, isPending: isTopUpPending } = useTopUpAgent();
    const { deleteAgent, isPending: isDeletePending, isSuccess: isDeleteSuccess, error: deleteError, resetState: resetDeleteState } = useDeleteAgent();
    const { toggleAgentStatus, isPending: isTogglePending } = useToggleAgentStatus();
    const router = useRouter();

    const [topUpAmount, setTopUpAmount] = useState("");
    const [topUpOpen, setTopUpOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handle successful deletion
    useEffect(() => {
        if (isDeleteSuccess && isDeleting) {
            toast.success("Agent deleted!", { description: "Funds have been refunded to your wallet." });
            setIsDeleting(false);
            resetDeleteState();
            router.push("/agents");
        }
    }, [isDeleteSuccess, isDeleting, router, resetDeleteState]);

    useEffect(() => {
        if (deleteError && isDeleting) {
            toast.error("Failed to delete agent", { description: deleteError.message || "Transaction failed" });
            setIsDeleting(false);
            resetDeleteState();
        }
    }, [deleteError, isDeleting, resetDeleteState]);

    // Token & Chain Info
    const tokenInfo = agent ? SUPPORTED_TOKENS.find(t => t.address === agent.token) : undefined;
    const symbol = tokenInfo?.symbol || (agent?.token === NATIVE_TOKEN ? "SOL" : "Tokens");
    const decimals = tokenInfo?.decimals || 9;
    const isNative = agent?.token === NATIVE_TOKEN;
    const displayBalance = agent ? (isNative ? agent.balance : agent.tokenBalance) : 0n;

    const { allowance, approveToken, isPending: isApprovePending } = useTokenApproval(
        agent?.token ?? "",
    );

    const topUpAmountBigInt = topUpAmount ? parseTokenAmount(topUpAmount, decimals) : 0n;
    const needsApproval = !isNative && topUpAmountBigInt > 0n && allowance < topUpAmountBigInt;


    // History Pagination State
    const [historyOpen, setHistoryOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleTopUp = async () => {
        try {
            if (isNative) {
                await topUpAgent(id, parseSol(topUpAmount), 0n);
            } else {
                await topUpAgent(id, 0n, parseTokenAmount(topUpAmount, decimals));
            }
            setTopUpOpen(false);
            setTopUpAmount("");
        } catch (e) {
            console.error(e);
        }
    };

    const handleApprove = async () => {
        if (topUpAmountBigInt > 0n) {
            await approveToken(topUpAmountBigInt);
        }
    };

    const handleToggleStatus = async () => {
        if (!agent) return;
        try {
            await toggleAgentStatus(id, !agent.isActive);
        } catch (e) {
            console.error(e);
        }
    };

    const totalSpent = history.reduce((acc, curr) => acc + curr.amount, 0n);

    const totalPages = Math.ceil(history.length / itemsPerPage);
    const currentHistoryPage = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const displayedHistory = history.slice(0, 5); // Show first 5 on main page

    if (agentLoading) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
    }

    if (!agent) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <h2 className="text-xl font-semibold">Agent Not Found</h2>
                <Button asChild><Link href="/agents">Back to Agents</Link></Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/agents"><ArrowLeft className="size-5" /></Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">{agent.description}</h1>
                            <Badge variant={agent.isActive ? "default" : "destructive"}>
                                {agent.isActive ? "Active" : "Paused"}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground font-mono text-sm mt-1">ID: #{agent.id.toString()} • {agent.to}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleStatus}
                        disabled={isTogglePending}
                    >
                        {isTogglePending ? (
                            <Loader2 className="size-4 animate-spin mr-2" />
                        ) : agent.isActive ? (
                            <Pause className="size-4 mr-2" />
                        ) : (
                            <Play className="size-4 mr-2" />
                        )}
                        {agent.isActive ? "Pause Agent" : "Resume Agent"}
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                            toast.info("Deleting agent...", { description: "Please confirm in your wallet" });
                            setIsDeleting(true);
                            const success = await deleteAgent(id);
                            if (!success) {
                                setIsDeleting(false);
                                toast.error("Failed to delete agent", { description: "Transaction was rejected" });
                            }
                        }}
                        disabled={isDeletePending || isDeleting}
                    >
                        {(isDeletePending || isDeleting) ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 mr-2" />}
                        Delete & Withdraw
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                        <Wallet className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatTokenAmount(displayBalance, decimals)} {symbol}</div>
                        <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="w-full mt-4">
                                    <Plus className="size-3 mr-1" /> Top Up
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Top Up Agent Balance</DialogTitle>
                                    <DialogDescription>Add {symbol} to ensure continued autonomous execution.</DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <Label>Amount ({symbol})</Label>
                                    <Input
                                        type="number"
                                        value={topUpAmount}
                                        onChange={e => setTopUpAmount(e.target.value)}
                                        placeholder="0.0"
                                    />
                                </div>
                                <DialogFooter>
                                    {needsApproval ? (
                                        <Button onClick={handleApprove} disabled={isApprovePending}>
                                            {isApprovePending && <Loader2 className="size-4 mr-2 animate-spin" />}
                                            Approve {symbol}
                                        </Button>
                                    ) : (
                                        <Button onClick={handleTopUp} disabled={!topUpAmount || isTopUpPending}>
                                            {isTopUpPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                                            Confirm
                                        </Button>
                                    )}
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payment Config</CardTitle>
                        <Activity className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatTokenAmount(agent.amount, decimals)} {symbol}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Every {formatDuration(Number(agent.interval))}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        <History className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {historyLoading ? (
                            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                        ) : (
                            <div className="text-2xl font-bold">{formatTokenAmount(totalSpent, decimals)} {symbol}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Across {history.length} executions
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Next Execution In</CardTitle>
                        <Clock className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl">
                            <CountdownTimer targetTimestamp={agent.nextExecution} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Scheduled: <ClientDate timestamp={Number(agent.nextExecution)} />
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* History Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Execution History</CardTitle>
                        <CardDescription>Verified on-chain payment logs.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { window.location.reload(); }} disabled={historyLoading}>
                            <RefreshCw className={`size-4 mr-2 ${historyLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        {history.length > 5 && (
                            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="secondary" size="sm">
                                        View All ({history.length})
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Full Execution History</DialogTitle>
                                        <DialogDescription>Complete log of all autonomous payments.</DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4 py-4">
                                        {currentHistoryPage.map((item) => (
                                            <div key={item.transactionHash} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-green-500/10 rounded-full">
                                                        <Bot className="size-4 text-green-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Payment Executed</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            <ClientDate timestamp={Number(item.timestamp)} />
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">-{formatTokenAmount(item.amount, decimals)} {symbol}</p>
                                                    <a
                                                        href={getExplorerUrl(item.transactionHash)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-primary hover:underline font-mono"
                                                    >
                                                        {item.transactionHash.slice(0, 6)}...{item.transactionHash.slice(-4)}
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-4 py-4">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="size-4" />
                                            </Button>
                                            <span className="text-sm text-muted-foreground">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                <ChevronRight className="size-4" />
                                            </Button>
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {historyLoading ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No payments executed yet.</div>
                    ) : (
                        <div className="space-y-4">
                            {displayedHistory.map((item) => (
                                <div key={item.transactionHash} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-green-500/10 rounded-full">
                                            <Bot className="size-4 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Payment Executed</p>
                                            <p className="text-xs text-muted-foreground">
                                                <ClientDate timestamp={Number(item.timestamp)} />
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">-{formatTokenAmount(item.amount, decimals)} {symbol}</p>
                                        <a
                                            href={getExplorerUrl(item.transactionHash)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-primary hover:underline font-mono"
                                        >
                                            {item.transactionHash.slice(0, 6)}...{item.transactionHash.slice(-4)}
                                        </a>
                                    </div>
                                </div>
                            ))}
                            {history.length > 5 && (
                                <div className="text-center pt-2">
                                    <p className="text-xs text-muted-foreground">
                                        Showing 5 of {history.length} transactions.
                                        <Button variant="link" size="sm" onClick={() => setHistoryOpen(true)} className="h-auto p-0 ml-1">View all</Button>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
