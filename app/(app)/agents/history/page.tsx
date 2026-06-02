"use client";

import { useAgentHistoryLog, ArchivedAgent } from "@/hooks/useAgentHistoryLog";
import { AgentHistoryDetailModal } from "@/components/AgentHistoryDetailModal";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, RefreshCw, Bot, CheckCircle2, Trash2, Clock, Eye, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAccount } from "@/hooks/useAccount";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, Suspense } from "react";
import { formatId } from "@/lib/utils";
import { NATIVE_TOKEN, SUPPORTED_TOKENS, formatTokenAmount, getTokenDecimals } from "@/lib/types";
import { ClientDate } from "@/components/ClientDate";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function AgentHistoryContent() {
    const { isConnected } = useAccount();
    const { archivedAgents, isLoading, error, refetch } = useAgentHistoryLog();
    const [activeTab, setActiveTab] = useState("all");
    const [selectedAgentId, setSelectedAgentId] = useState<bigint | null>(null);

    // Find selected agent from fresh data
    const selectedAgent = selectedAgentId !== null
        ? archivedAgents.find(a => a.id === selectedAgentId) || null
        : null;

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="p-6 bg-muted/30 rounded-full">
                    <History className="size-16 text-muted-foreground/50" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Agent History</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Connect your wallet to view the history of all your AI agents.
                    </p>
                </div>
                <WalletMultiButton />
            </div>
        );
    }

    // Categorize agents
    const completedAgents = archivedAgents.filter(a => a.terminationReason === 'completed');
    const deletedAgents = archivedAgents.filter(a => a.terminationReason === 'deleted');
    const activeAgents = archivedAgents.filter(a => a.terminationReason === 'active');

    const getFilteredAgents = (): ArchivedAgent[] => {
        switch (activeTab) {
            case 'completed':
                return completedAgents;
            case 'deleted':
                return deletedAgents;
            case 'active':
                return activeAgents;
            default:
                return archivedAgents;
        }
    };

    const filteredAgents = getFilteredAgents();

    const getStatusBadge = (reason: ArchivedAgent['terminationReason']) => {
        switch (reason) {
            case 'completed':
                return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="size-3 mr-1" />Completed</Badge>;
            case 'deleted':
                return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30"><Trash2 className="size-3 mr-1" />Deleted</Badge>;
            case 'active':
                return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="size-3 mr-1" />Active</Badge>;
        }
    };

    const getTokenInfo = (token: string) => {
        const tokenInfo = SUPPORTED_TOKENS.find(t => t.address === token);
        return {
            symbol: tokenInfo?.symbol || (token === NATIVE_TOKEN ? "SOL" : "Tokens"),
            decimals: tokenInfo?.decimals || 9
        };
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <History className="size-8 text-primary" />
                        Agent History
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Track all your agents - completed payments, terminated bots, and active agents.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={refetch} disabled={isLoading}>
                        <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button asChild>
                        <Link href="/agents">
                            <Bot className="mr-2 size-4" />
                            My Agents
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-linear-to-br from-primary/10 to-transparent border border-primary/20">
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <Bot className="size-4" />
                        <span className="text-sm font-medium">Total Agents</span>
                    </div>
                    <p className="text-2xl font-bold">{archivedAgents.length}</p>
                </div>
                <div className="p-4 rounded-lg bg-linear-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-emerald-500 mb-2">
                        <CheckCircle2 className="size-4" />
                        <span className="text-sm font-medium">Completed</span>
                    </div>
                    <p className="text-2xl font-bold">{completedAgents.length}</p>
                </div>
                <div className="p-4 rounded-lg bg-linear-to-br from-red-500/10 to-transparent border border-red-500/20">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                        <Trash2 className="size-4" />
                        <span className="text-sm font-medium">Deleted</span>
                    </div>
                    <p className="text-2xl font-bold">{deletedAgents.length}</p>
                </div>
                <div className="p-4 rounded-lg bg-linear-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                    <div className="flex items-center gap-2 text-blue-500 mb-2">
                        <Clock className="size-4" />
                        <span className="text-sm font-medium">Active</span>
                    </div>
                    <p className="text-2xl font-bold">{activeAgents.length}</p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="all" className="gap-2">
                            All ({archivedAgents.length})
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="gap-2">
                            Completed ({completedAgents.length})
                        </TabsTrigger>
                        <TabsTrigger value="deleted" className="gap-2">
                            Deleted ({deletedAgents.length})
                        </TabsTrigger>
                        <TabsTrigger value="active" className="gap-2">
                            Active ({activeAgents.length})
                        </TabsTrigger>
                    </TabsList>
                </div>

                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-16 space-y-4"
                        >
                            <Loader2 className="size-10 animate-spin text-primary" />
                            <div className="text-center">
                                <p className="text-muted-foreground">Loading agent history...</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">Scanning blockchain events</p>
                            </div>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 space-y-4 border-2 border-dashed rounded-lg border-destructive/30"
                        >
                            <div className="p-4 bg-destructive/10 rounded-full w-fit mx-auto">
                                <History className="size-8 text-destructive" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium text-destructive">Failed to Load History</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">{error}</p>
                            </div>
                            <Button variant="outline" onClick={refetch}>
                                <RefreshCw className="size-4 mr-2" />
                                Try Again
                            </Button>
                        </motion.div>
                    ) : filteredAgents.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-12 space-y-4 border-2 border-dashed rounded-lg"
                        >
                            <Image
                                src="/bogent-empty.png"
                                alt="No agents"
                                width={120}
                                height={120}
                                className="mx-auto opacity-50"
                            />
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium">No Agents Found</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                    {activeTab === 'all'
                                        ? "You haven't created any agents yet."
                                        : activeTab === 'completed'
                                            ? "No agents have completed their payment schedule yet."
                                            : activeTab === 'deleted'
                                                ? "You haven't deleted any agents."
                                                : "You have no active agents."}
                                </p>
                            </div>
                            <Button asChild variant="outline">
                                <Link href="/agents/new">Create Your First Agent</Link>
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="table"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="rounded-md border"
                        >
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Total Paid</TableHead>
                                        <TableHead>Executions</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAgents.map((agent, idx) => {
                                        const { symbol, decimals } = getTokenInfo(agent.token);
                                        return (
                                            <motion.tr
                                                key={agent.id.toString()}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                                                onClick={() => setSelectedAgentId(agent.id)}
                                            >
                                                <TableCell className="font-mono text-xs">{formatId(agent.id)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Bot className="size-4 text-muted-foreground" />
                                                        <span className="font-medium truncate max-w-[200px]">{agent.description}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(agent.terminationReason)}</TableCell>
                                                <TableCell className="font-medium text-green-500">
                                                    {formatTokenAmount(agent.totalPaid, decimals)} {symbol}
                                                </TableCell>
                                                <TableCell>{agent.totalExecutions}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    <ClientDate timestamp={Number(agent.createdAt)} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setSelectedAgentId(agent.id)}
                                                        >
                                                            <Eye className="size-4 mr-1" />
                                                            View
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="size-8">
                                                                    <MoreHorizontal className="size-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => setSelectedAgentId(agent.id)}>
                                                                    <Eye className="size-4 mr-2" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Tabs>

            {/* Detail Modal */}
            <AgentHistoryDetailModal
                agent={selectedAgent}
                isOpen={!!selectedAgent}
                onClose={() => setSelectedAgentId(null)}
            />
        </div>
    );
}

export default function AgentHistoryPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Loader2 className="size-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading...</p>
            </div>
        }>
            <AgentHistoryContent />
        </Suspense>
    );
}

