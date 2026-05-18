"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateAgent } from "@/hooks/useCreateAgent";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Bot, Info } from "lucide-react";
import Link from "next/link";
import { parseEther, parseUnits } from "viem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SUPPORTED_TOKENS, NATIVE_TOKEN, CONTRACT_CONFIG } from "@/lib/contracts";

const useTokenApproval = () => ({ allowance: 1000000n, approveToken: async () => {}, isPending: false });
import { TransactionModal, TransactionState } from "@/components/TransactionModal";
import { toast } from "sonner";

export default function NewAgentPage() {
    const router = useRouter();
    const chainId = useChainId();
    const { createAgent, isPending, isSuccess, hash, error } = useCreateAgent();

    const availableTokens = SUPPORTED_TOKENS.filter(t => t.chainId === 0 || t.chainId === chainId);

    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [token, setToken] = useState(NATIVE_TOKEN);
    const [customToken, setCustomToken] = useState("");
    const [interval, setInterval] = useState("604800"); // 1 week
    const [description, setDescription] = useState("");
    const [initialDeposit, setInitialDeposit] = useState("");
    const [endDate, setEndDate] = useState("");
    const [endTime, setEndTime] = useState("");

    // Transaction state tracking
    const [txState, setTxState] = useState<TransactionState>('idle');
    const [txError, setTxError] = useState<string | undefined>();

    const selectedToken = SUPPORTED_TOKENS.find(t => t.address === token) || { symbol: "Custom", decimals: 18 };
    const isNative = token === NATIVE_TOKEN;
    const finalTokenAddress = token === "custom" ? customToken : token;

    // Get contract address for approval
    const config = CONTRACT_CONFIG[chainId];
    const contractAddress = config?.address;

    // Token Approval Hook
    const { allowance, approveToken, isPending: isApprovePending, isLoadingAllowance } = useTokenApproval(
        finalTokenAddress as `0x${string}`,
        contractAddress
    );

    const depositAmountBigInt = initialDeposit ? parseUnits(initialDeposit, selectedToken.decimals) : 0n;
    const needsApproval = !isNative && depositAmountBigInt > 0n && allowance < depositAmountBigInt;

    // Track if modal was manually dismissed
    const [dismissed, setDismissed] = useState(false);

    // Watch for transaction state changes
    useEffect(() => {
        if (dismissed) return;

        if (isPending && txState === 'confirming') {
            setTxState('pending');
        }
        if (isSuccess && hash) {
            setTxState('success');
            toast.success("Agent created successfully!", {
                description: "Your payment agent is now active."
            });
        }
    }, [isPending, isSuccess, hash, txState, dismissed]);

    useEffect(() => {
        if (dismissed) return;
        if (error) {
            setTxState('error');
            setTxError(error.message || "Transaction failed");
            toast.error("Failed to create agent", {
                description: error.message?.slice(0, 100)
            });
        }
    }, [error, dismissed]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTxState('confirming');
        setTxError(undefined);

        const result = await createAgent(
            recipient,
            parseUnits(amount, selectedToken.decimals),
            finalTokenAddress,
            BigInt(interval),
            description,
            isNative ? parseUnits(initialDeposit, 18) : 0n, // MNT Deposit (value)
            isNative ? 0n : depositAmountBigInt, // Token Deposit
            (endDate && endTime) ? BigInt(Math.floor(new Date(`${endDate}T${endTime}`).getTime() / 1000)) : 0n
        );

        if (!result.success) {
            setTxState('error');
            setTxError(result.error || "Transaction failed");
            toast.error("Failed to create agent", { description: result.error });
        }
    };

    const handleCancel = () => {
        setDismissed(true);
        setTxState('idle');
        setTxError(undefined);
    };

    const handleApprove = async () => {
        if (depositAmountBigInt > 0n) {
            toast.info("Approving token...", { description: "Please confirm in your wallet" });
            await approveToken(depositAmountBigInt);
            toast.success("Token approved!");
        }
    };


    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent">
                    <Link href="/agents" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="size-4" />
                        Back to Agents
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Create New Agent</h1>
                <p className="text-muted-foreground">
                    Configure an automated payment bot.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Bot className="size-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Agent Configuration</CardTitle>
                                <CardDescription>Define who this agent pays and how often.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Agent Name / Description</Label>
                            <Input
                                id="description"
                                placeholder="e.g. Weekly Allowance"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        {/* Token Selector */}
                        <div className="space-y-2">
                            <Label>Payment Token</Label>
                            <Select value={token} onValueChange={setToken}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Token" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTokens.map((t) => (
                                        <SelectItem key={t.address} value={t.address}>
                                            <div className="flex items-center gap-2">
                                                {t.logo && <img src={t.logo} alt={t.symbol} className="size-4 rounded-full" />}
                                                {t.symbol} - {t.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="custom">Custom Token Address</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {token === "custom" && (
                            <div className="space-y-2">
                                <Label htmlFor="customToken">Token Address</Label>
                                <Input
                                    id="customToken"
                                    placeholder="0x..."
                                    value={customToken}
                                    onChange={(e) => setCustomToken(e.target.value)}
                                    required
                                    pattern="^0x[a-fA-F0-9]{40}$"
                                />
                            </div>
                        )}

                        {/* Recipient */}
                        <div className="space-y-2">
                            <Label htmlFor="recipient">Recipient Address</Label>
                            <Input
                                id="recipient"
                                placeholder="0x..."
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                required
                                pattern="^0x[a-fA-F0-9]{40}$"
                            />
                        </div>

                        {/* Amount & Frequency */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Payment Amount</Label>
                                <div className="relative">
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.000001"
                                        placeholder="0.0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs font-mono text-muted-foreground">
                                        {token === "custom" ? "Tokens" : selectedToken.symbol}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="interval">Frequency</Label>
                                <Select value={interval} onValueChange={setInterval}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="60">Every Minute (Testing)</SelectItem>
                                        <SelectItem value="3600">Every Hour</SelectItem>
                                        <SelectItem value="86400">Daily</SelectItem>
                                        <SelectItem value="604800">Weekly</SelectItem>
                                        <SelectItem value="2592000">Monthly (30 Days)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Termination Settings */}
                        <div className="space-y-4 pt-4 border-t">
                            <Label className="text-base font-semibold">Termination (Optional)</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="endDate" className="text-sm font-normal">End Date</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime" className="text-sm font-normal">End Time</Label>
                                    <Input
                                        id="endTime"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        disabled={!endDate}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                If set, the agent will automatically stop payments after this date.
                            </p>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="deposit" className="text-base font-semibold">Initial Deposit ({selectedToken.symbol})</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="size-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">Funds are transferred to the agent contract.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                {isNative ? (
                                    <Alert className="bg-muted/50 border-primary/20">
                                        <Bot className="size-4 text-primary" />
                                        <AlertTitle>Agent Balance</AlertTitle>
                                        <AlertDescription className="text-muted-foreground text-xs mt-1">
                                            This deposit will fund the agent.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300">
                                        <Info className="size-4" />
                                        <AlertTitle>Stablecoin Agent</AlertTitle>
                                        <AlertDescription className="text-xs mt-2">
                                            This agent will hold {selectedToken.symbol}. You will need to approve the transfer first.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="relative">
                                    <Input
                                        id="deposit"
                                        type="number"
                                        step="0.000001"
                                        placeholder="0.0"
                                        value={initialDeposit}
                                        onChange={(e) => setInitialDeposit(e.target.value)}
                                        required
                                        min={amount} // Initial deposit should cover at least one payment? User preference.
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs font-mono text-muted-foreground">{selectedToken.symbol}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 border-t pt-6">
                        <Button variant="ghost" asChild type="button">
                            <Link href="/agents">Cancel</Link>
                        </Button>

                        {needsApproval ? (
                            <Button type="button" onClick={handleApprove} disabled={isApprovePending}>
                                {isApprovePending ? (
                                    <>
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                        Approving...
                                    </>
                                ) : (
                                    `Approve ${selectedToken.symbol}`
                                )}
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isPending || !initialDeposit || !amount || !recipient}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                        Creating Agent...
                                    </>
                                ) : (
                                    "Create Agent"
                                )}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </form>

            {/* Transaction Status Modal */}
            <TransactionModal
                isOpen={txState !== 'idle'}
                onClose={handleCancel}
                onCancel={handleCancel}
                state={txState}
                title="Creating Agent"
                description={`Deploying your ${description || 'payment agent'} on Mantle...`}
                txHash={hash}
                error={txError}
                successMessage="Your agent has been deployed and is ready to execute payments!"
                onSuccessAction={() => router.push("/agents")}
                successActionLabel="View Agents"
            />
        </div>
    );
}

