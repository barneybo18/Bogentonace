"use client";

import { ScheduledPayment, NATIVE_TOKEN, SUPPORTED_TOKENS, formatTokenAmount, parseSol, parseTokenAmount } from "@/lib/types";
import { formatId } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, RefreshCw, Trash2, Wallet, Plus, Loader2, Pause, Play, Coins, AlertCircle, Pencil, Calendar, CheckCircle2, PartyPopper } from "lucide-react";
import Link from "next/link";
import { ClientDate } from "@/components/ClientDate";
import { useState, useEffect } from "react";
import { useTopUpAgent } from "@/hooks/useTopUpAgent";
import { useDeleteAgent } from "@/hooks/useDeleteAgent";
import { useToggleAgentStatus } from "@/hooks/useToggleAgentStatus";

const useTokenApproval = (...args: any[]) => ({ allowance: 1000000n, approveToken: async (...args: any[]) => {}, isPending: false });
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { EditAgentModal } from "@/components/EditAgentModal";

interface AgentCardProps {
    agent: ScheduledPayment;
    onUpdate: () => void;
    totalSent?: bigint;
}

export function AgentCard({ agent, onUpdate, totalSent = 0n }: AgentCardProps) {
    const { topUpAgent, isPending: isTopUpPending } = useTopUpAgent();
    const { deleteAgent, isPending: isDeletePending, isSuccess: isDeleteSuccess, error: deleteError, resetState: resetDeleteState } = useDeleteAgent();
    const { toggleAgentStatus, isPending: isTogglePending } = useToggleAgentStatus();
    const chainId = 1;

    const [topUpAmount, setTopUpAmount] = useState("");
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showRestartGuide, setShowRestartGuide] = useState(false);

    const tokenInfo = SUPPORTED_TOKENS.find(t => t.address === agent.token);
    const symbol = tokenInfo?.symbol || (agent.token === NATIVE_TOKEN ? "SOL" : "Tokens");
    const decimals = tokenInfo?.decimals || 9;
    const isNative = agent.token === NATIVE_TOKEN;

    // Check if agent is terminated (Inactive + Past End Date)
    const now = BigInt(Math.floor(Date.now() / 1000));
    const isTerminated = !agent.isActive && agent.endDate > 0n && now >= agent.endDate;

    // Check if agent is completed (balance fully exhausted - paid all allocated tokens)
    const displayBalance = isNative ? agent.balance : agent.tokenBalance;
    const isCompleted = displayBalance === 0n && !agent.isActive && totalSent > 0n;

    // Token Approval for Top Up
    const { allowance, approveToken, isPending: isApprovePending } = useTokenApproval(
        agent.token,
    );

    const topUpAmountBigInt = topUpAmount ? parseTokenAmount(topUpAmount, decimals) : 0n;
    const needsApproval = !isNative && topUpAmountBigInt > 0n && allowance < topUpAmountBigInt;

    // Track delete success to show toast and refetch
    useEffect(() => {
        if (isDeleteSuccess && isDeleting) {
            toast.success("Agent deleted!", { description: "Funds have been refunded to your wallet." });
            setIsDeleting(false);
            resetDeleteState();
            onUpdate();
        }
    }, [isDeleteSuccess, isDeleting, onUpdate, resetDeleteState]);

    useEffect(() => {
        if (showRestartGuide && agent.isActive) {
            setShowRestartGuide(false);
            setIsEditOpen(true);
            toast.info("Agent Resumed", { description: "Now remove the termination date to keep it running!" });
        }
    }, [showRestartGuide, agent.isActive]);

    // Track delete error
    useEffect(() => {
        if (deleteError && isDeleting) {
            toast.error("Failed to delete agent", { description: deleteError.message || "Transaction failed" });
            setIsDeleting(false);
            resetDeleteState();
        }
    }, [deleteError, isDeleting, resetDeleteState]);

    const handleTopUp = async () => {
        if (!topUpAmount) return;
        try {
            if (isNative) {
                await topUpAgent(agent.id, parseSol(topUpAmount), 0n);
            } else {
                await topUpAgent(agent.id, 0n, parseTokenAmount(topUpAmount, decimals));
            }

            setIsTopUpOpen(false);
            setTopUpAmount("");
            toast.success("Top up successful!");
            onUpdate();
        } catch (e) {
            console.error(e);
            toast.error("Top up failed");
        }
    };

    const handleApprove = async () => {
        if (topUpAmountBigInt > 0n) {
            await approveToken(topUpAmountBigInt);
        }
    };

    const handleToggleStatus = async () => {
        try {
            if (isTerminated) {
                setShowRestartGuide(true);
            }
            await toggleAgentStatus(agent.id, !agent.isActive);
            toast.success(agent.isActive ? "Agent paused" : "Agent resumed");
            onUpdate();
        } catch (e) {
            console.error(e);
            toast.error("Failed to update agent status");
            setShowRestartGuide(false);
        }
    };

    const handleDelete = async () => {
        toast.info("Deleting agent...", { description: "Verifying transaction..." });
        setIsDeleting(true);
        const result = await deleteAgent(agent.id);
        if (!result.success) {
            setIsDeleting(false);
            toast.error("Failed to delete agent", { description: result.error || "Transaction was rejected" });
        }
    };

    const formatInterval = (seconds: bigint) => {
        const mins = Number(seconds) / 60;
        if (mins < 60) return `${mins} mins`;
        const hours = mins / 60;
        if (hours < 24) return `${hours} hours`;
        return `${hours / 24} days`;
    };

    // Get status info
    const getStatusInfo = () => {
        if (isCompleted) {
            return {
                label: "Completed",
                variant: "default" as const,
                className: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
                icon: <CheckCircle2 className="size-3 mr-1" />
            };
        }
        if (isTerminated) {
            return {
                label: "Terminated",
                variant: "destructive" as const,
                className: "",
                icon: null
            };
        }
        if (agent.isActive) {
            return {
                label: "Active",
                variant: "default" as const,
                className: "",
                icon: null
            };
        }
        return {
            label: "Paused",
            variant: "secondary" as const,
            className: "",
            icon: null
        };
    };


    const statusInfo = getStatusInfo();

    return (
        <Card className={`relative overflow-hidden border-2 transition-colors ${isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : isTerminated ? 'border-orange-500/20 bg-orange-50/10' : 'hover:border-primary/50'}`}>
            <div className="absolute top-0 right-0 p-4">
                <Badge variant={statusInfo.variant} className={statusInfo.className}>
                    {statusInfo.icon}
                    {statusInfo.label}
                </Badge>
            </div>

            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {isNative ? <Bot className="size-6 text-primary" /> : <Coins className="size-6 text-blue-500" />}
                    </div>
                    <div>
                        <CardTitle>{agent.description || "Unnamed Agent"}</CardTitle>
                        <CardDescription>
                            {formatId(agent.id)} • {symbol} Agent
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Wallet className="size-4" />
                            Balance
                        </span>
                        <span className="text-lg font-bold">
                            {formatTokenAmount(displayBalance || 0n, decimals)} {symbol}
                        </span>
                    </div>

                    <div className="h-px bg-border" />

                    {isCompleted && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <PartyPopper className="size-4" />
                            <span className="text-sm font-medium">All payments completed!</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-500">Total Paid</span>
                        <span className="font-bold text-green-600">{formatTokenAmount(totalSent, decimals)} {symbol}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Payment Amount</span>
                        <span className="font-medium">{formatTokenAmount(agent.amount, decimals)} {symbol}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Frequency</span>
                        <span className="font-medium flex items-center gap-1">
                            <RefreshCw className="size-3" />
                            Every {formatInterval(agent.interval)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Next Payment</span>
                        <span className="font-medium text-xs">
                            {isTerminated ? <span>--</span> : <ClientDate timestamp={Number(agent.nextExecution)} />}
                        </span>
                    </div>
                    {agent.endDate && agent.endDate > 0n && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="size-3" />
                                {isTerminated ? "Terminated On" : "Terminates"}
                            </span>
                            <span className={`font-medium text-xs ${isTerminated ? "text-red-500" : "text-orange-500"}`}>
                                <ClientDate timestamp={Number(agent.endDate)} />
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="gap-2">
                <Button className="flex-1" variant="secondary" asChild>
                    <Link href={`/agents/${agent.id}`}>
                        View Details
                    </Link>
                </Button>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleToggleStatus}
                                disabled={isTogglePending}
                            >
                                {isTogglePending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : isTerminated ? (
                                    <RefreshCw className="size-4" />
                                ) : agent.isActive ? (
                                    <Pause className="size-4" />
                                ) : (
                                    <Play className="size-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isTerminated ? "Restart Agent" : (agent.isActive ? "Pause Agent" : "Resume Agent")}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setIsEditOpen(true)}
                                    disabled={!agent.isActive && !isTerminated}
                                >
                                    <Pencil className="size-4" />
                                </Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{!agent.isActive ? "Resume agent to edit" : "Edit Agent"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <EditAgentModal
                    agent={agent}
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onUpdate={onUpdate}
                />

                <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                    <DialogTrigger asChild>
                        <div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <Plus className="size-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Top Up Agent Balance</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Top Up Agent</DialogTitle>
                            <DialogDescription>
                                Add {symbol} to this agent's balance.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount ({symbol})</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0.0"
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            {needsApproval ? (
                                <Button onClick={handleApprove} disabled={isApprovePending}>
                                    {isApprovePending && <Loader2 className="size-4 mr-2 animate-spin" />}
                                    Approve {symbol}
                                </Button>
                            ) : (
                                <Button onClick={handleTopUp} disabled={isTopUpPending || !topUpAmount}>
                                    {isTopUpPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                                    Confirm Top Up
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant={isCompleted ? "outline" : "destructive"}
                            size="icon"
                            disabled={isDeletePending}
                        >
                            {isDeletePending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {isCompleted ? "Delete Completed Agent?" : "Delete Agent?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {isCompleted
                                    ? "This agent has finished all its payments. Deleting it will remove it permanently from your dashboard."
                                    : `This will permanently delete the agent and refund all remaining funds (${formatTokenAmount(displayBalance, decimals)} ${symbol}) to your wallet.`
                                }
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className={isCompleted ? "" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
                            >
                                {isCompleted ? "Delete Agent" : "Delete & Refund"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}

