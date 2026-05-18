"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NATIVE_TOKEN, SUPPORTED_TOKENS } from "@/lib/contracts";
import { formatUnits } from "viem";
import { formatId } from "@/lib/utils";
import { useAgentHistory } from "@/hooks/useAgentHistory";
import { ArchivedAgent, AgentEventType } from "@/hooks/useAgentHistoryLog";

import {
    Bot,
    CheckCircle2,
    Trash2,
    Clock,
    ArrowRight,
    Play,
    Pause,
    Plus,
    Minus,
    ExternalLink,
    Loader2,
    Coins,
    Calendar,
    Wallet,
    RefreshCw,
    User,
} from "lucide-react";
import { ClientDate } from "@/components/ClientDate";

interface AgentHistoryDetailModalProps {
    agent: ArchivedAgent | null;
    isOpen: boolean;
    onClose: () => void;
}

const eventTypeConfig: Record<AgentEventType, { icon: typeof Bot; label: string; color: string }> = {
    created: { icon: Bot, label: "Agent Created", color: "text-green-500" },
    executed: { icon: ArrowRight, label: "Payment Executed", color: "text-blue-500" },
    cancelled: { icon: Trash2, label: "Agent Deleted", color: "text-red-500" },
    paused: { icon: Pause, label: "Agent Paused", color: "text-yellow-500" },
    resumed: { icon: Play, label: "Agent Resumed", color: "text-green-500" },
    topup: { icon: Plus, label: "Balance Added", color: "text-emerald-500" },
    withdrawn: { icon: Minus, label: "Funds Withdrawn", color: "text-orange-500" },
};

export function AgentHistoryDetailModal({ agent, isOpen, onClose }: AgentHistoryDetailModalProps) {
    const chainId = useChainId();

    const { history: detailedEvents, isLoading: eventsLoading } = useAgentHistory(
        isOpen && agent ? agent.id : undefined
    );

    if (!agent) return null;

    const tokenInfo = SUPPORTED_TOKENS.find(t => t.address === agent.token);
    const symbol = tokenInfo?.symbol || (agent.token === NATIVE_TOKEN ? "MNT" : "Tokens");
    const decimals = tokenInfo?.decimals || 18;
    const isNative = agent.token === NATIVE_TOKEN;

    const getExplorerUrl = (txHash: string) => {
        if (chainId === 5000) {
            return `https://mantlescan.xyz/tx/${txHash}`;
        }
        return `https://sepolia.mantlescan.xyz/tx/${txHash}`;
    };

    const getStatusBadge = () => {
        switch (agent.terminationReason) {
            case 'completed':
                return (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        <CheckCircle2 className="size-3 mr-1" />
                        Completed
                    </Badge>
                );
            case 'deleted':
                return (
                    <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                        <Trash2 className="size-3 mr-1" />
                        Deleted
                    </Badge>
                );
            case 'active':
                return (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <Clock className="size-3 mr-1" />
                        Active
                    </Badge>
                );
        }
    };

    const formatInterval = (seconds: bigint) => {
        const mins = Number(seconds) / 60;
        if (mins < 60) return `${mins} mins`;
        const hours = mins / 60;
        if (hours < 24) return `${hours} hours`;
        return `${hours / 24} days`;
    };

    const events = detailedEvents.length > 0
        ? detailedEvents.map(e => ({
            type: 'executed' as AgentEventType,
            transactionHash: e.transactionHash,
            timestamp: e.timestamp,
            amount: e.amount,
            to: e.to,
        }))
        : agent.events;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4 border-b">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`size-12 rounded-lg flex items-center justify-center ${agent.terminationReason === 'completed'
                                    ? 'bg-emerald-500/20'
                                    : agent.terminationReason === 'deleted'
                                        ? 'bg-red-500/20'
                                        : 'bg-blue-500/20'
                                }`}>
                                {isNative
                                    ? <Bot className={`size-6 ${agent.terminationReason === 'completed' ? 'text-emerald-500' : agent.terminationReason === 'deleted' ? 'text-red-500' : 'text-blue-500'}`} />
                                    : <Coins className={`size-6 ${agent.terminationReason === 'completed' ? 'text-emerald-500' : agent.terminationReason === 'deleted' ? 'text-red-500' : 'text-blue-500'}`} />
                                }
                            </div>
                            <div>
                                <DialogTitle className="text-xl">{agent.description}</DialogTitle>
                                <p className="text-sm text-muted-foreground">
                                    {formatId(agent.id)} • {symbol} Agent
                                </p>
                            </div>
                        </div>
                        {getStatusBadge()}
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-6 py-4">
                        {/* Stats Summary */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Wallet className="size-4" />
                                    Total Paid
                                </div>
                                <p className="text-2xl font-bold text-green-500">
                                    {formatUnits(agent.totalPaid, decimals)} {symbol}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <ArrowRight className="size-4" />
                                    Executions
                                </div>
                                <p className="text-2xl font-bold">{agent.totalExecutions}</p>
                            </div>
                        </div>

                        {/* Agent Details */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Details</h4>
                            <div className="grid gap-3 p-4 rounded-lg bg-muted/30">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Coins className="size-4" />
                                        Payment Amount
                                    </span>
                                    <span className="font-medium">{formatUnits(agent.amount, decimals)} {symbol}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <RefreshCw className="size-4" />
                                        Interval
                                    </span>
                                    <span className="font-medium">Every {formatInterval(agent.interval)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <User className="size-4" />
                                        Recipient
                                    </span>
                                    <span className="font-mono text-sm">
                                        {agent.to.slice(0, 8)}...{agent.to.slice(-6)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="size-4" />
                                        Created
                                    </span>
                                    <span className="font-medium text-sm">
                                        <ClientDate timestamp={Number(agent.createdAt)} />
                                    </span>
                                </div>
                                {agent.terminatedAt && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                                            {agent.terminationReason === 'completed'
                                                ? <CheckCircle2 className="size-4 text-emerald-500" />
                                                : <Trash2 className="size-4 text-red-500" />
                                            }
                                            {agent.terminationReason === 'completed' ? 'Completed' : 'Deleted'}
                                        </span>
                                        <span className={`font-medium text-sm ${agent.terminationReason === 'completed' ? 'text-emerald-500' : 'text-red-500'}`}>
                                            <ClientDate timestamp={Number(agent.terminatedAt)} />
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Activity Timeline */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Activity Timeline
                                {eventsLoading && <Loader2 className="size-3 animate-spin inline ml-2" />}
                            </h4>

                            {events.length === 0 && !eventsLoading ? (
                                <p className="text-sm text-muted-foreground p-4 text-center">No activity recorded</p>
                            ) : (
                                <div className="relative pl-4 space-y-3">
                                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                                    {events.map((event, idx) => {
                                        const config = eventTypeConfig[event.type] || eventTypeConfig.executed;
                                        const Icon = config.icon;
                                        return (
                                            <div key={idx} className="relative flex items-start gap-3">
                                                <div className={`size-4 rounded-full bg-background border-2 ${config.color} flex items-center justify-center z-10`} style={{ borderColor: 'currentColor' }}>
                                                    <div className="size-1.5 rounded-full bg-current" />
                                                </div>
                                                <div className="flex-1 min-w-0 pb-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Icon className={`size-3 ${config.color}`} />
                                                        <span className="text-sm font-medium">{config.label}</span>
                                                        {event.amount && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {formatUnits(event.amount, decimals)} {symbol}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-muted-foreground">
                                                            <ClientDate timestamp={Number(event.timestamp)} />
                                                        </span>
                                                        <a
                                                            href={getExplorerUrl(event.transactionHash)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                                        >
                                                            View TX <ExternalLink className="size-3" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

