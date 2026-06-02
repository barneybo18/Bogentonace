"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Loader2, User, Wallet, Coins, Calendar, FileText } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useCreateInvoice } from "@/hooks/useCreateInvoice";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton as ConnectButton } from "@solana/wallet-adapter-react-ui";
import { SUPPORTED_TOKENS, NATIVE_TOKEN, parseSol, parseTokenAmount } from "@/lib/types";
import { TransactionModal, TransactionState } from "@/components/TransactionModal";

export default function NewInvoicePage() {
    const router = useRouter();
    const { connected: isConnected } = useWallet();
    const { createInvoice, isPending, isSuccess, hash, error } = useCreateInvoice();

    const [payeeName, setPayeeName] = useState("");
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [token, setToken] = useState(NATIVE_TOKEN);
    const [date, setDate] = useState("");
    const [desc, setDesc] = useState("");

    // Transaction state tracking
    const [txState, setTxState] = useState<TransactionState>('idle');
    const [txError, setTxError] = useState<string | undefined>();

    // Filter tokens based on current chain
    const availableTokens = useMemo(() => {
        return SUPPORTED_TOKENS;
    }, []);

    // Get selected token details
    const selectedToken = useMemo(() => {
        return availableTokens.find(t => t.address === token) || availableTokens[0];
    }, [token, availableTokens]);

    // Set default due date to 7 days from now
    useEffect(() => {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        setDate(defaultDate.toISOString().split('T')[0]);
    }, []);

    // Track if modal was manually dismissed to prevent useEffect from reopening it
    const [dismissed, setDismissed] = useState(false);

    // Watch for transaction state changes
    useEffect(() => {
        if (dismissed) return; // Don't update state if user dismissed the modal

        if (isPending && txState === 'confirming') {
            setTxState('pending');
        }
        if (isSuccess && hash) {
            setTxState('success');
        }
    }, [isPending, isSuccess, hash, txState, dismissed]);

    useEffect(() => {
        if (dismissed) return;
        if (error) {
            setTxState('error');
            setTxError(error.message || "Transaction failed");
        }
    }, [error, dismissed]);

    const handleSubmit = async () => {
        if (!recipient || !amount || !date) return;

        // Basic Solana address validation
        const isBase58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(recipient);
        if (!isBase58) {
            alert('Please enter a valid Solana address');
            return;
        }

        setTxState('confirming');
        setTxError(undefined);

        // Create JSON metadata with name and description
        const metadata = JSON.stringify({
            name: payeeName.trim() || null,
            description: desc.trim() || null,
        });

        const timestamp = Math.floor(new Date(date).getTime() / 1000);
        const amountInUnits = selectedToken.address === NATIVE_TOKEN
            ? parseSol(amount).toString()
            : parseTokenAmount(amount, selectedToken.decimals).toString();

        try {
            await createInvoice(recipient, amountInUnits, token, metadata, timestamp);
        } catch (e: any) {
            setTxState('error');
            setTxError(e.message || "Transaction failed");
        }
    };

    const handleCancel = () => {
        setDismissed(true);
        setTxState('idle');
        setTxError(undefined);
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Create Invoice</h2>
                    <p className="text-muted-foreground">Connect your wallet to create invoices</p>
                </div>
                <ConnectButton />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/invoices"><ChevronLeft className="size-4" /></Link>
                </Button>
                <h2 className="text-3xl font-bold tracking-tight">New Invoice</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                    <CardDescription>Create a new on-chain payment request.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Payee Name */}
                    <div className="space-y-2">
                        <Label htmlFor="payeeName" className="flex items-center gap-2">
                            <User className="size-4 text-muted-foreground" />
                            Payee Name
                        </Label>
                        <Input
                            id="payeeName"
                            placeholder="John Doe or Company Name"
                            value={payeeName}
                            onChange={e => setPayeeName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Optional - helps identify who needs to pay</p>
                    </div>

                    {/* Recipient Wallet */}
                    <div className="space-y-2">
                        <Label htmlFor="recipient" className="flex items-center gap-2">
                            <Wallet className="size-4 text-muted-foreground" />
                            Recipient Wallet *
                        </Label>
                        <Input
                            id="recipient"
                            placeholder="0x..."
                            value={recipient}
                            onChange={e => setRecipient(e.target.value)}
                            className={recipient && (!recipient.startsWith('0x') || recipient.length !== 42) ? 'border-red-500' : ''}
                        />
                        {recipient && (!recipient.startsWith('0x') || recipient.length !== 42) && (
                            <p className="text-xs text-red-500">Please enter a valid address</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount ({selectedToken.symbol}) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step={(selectedToken.decimals as number) === 6 ? "0.000001" : "0.001"}
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Token</Label>
                            <Select value={token} onValueChange={setToken}>
                                <SelectTrigger className="w-full">
                                    <SelectValue>
                                        <div className="flex items-center gap-2">
                                            {selectedToken.logo && (
                                                <img
                                                    src={selectedToken.logo}
                                                    alt={selectedToken.symbol}
                                                    className="h-4 w-4 rounded-full"
                                                />
                                            )}
                                            <span>{selectedToken.symbol}</span>
                                        </div>
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTokens.map((t) => (
                                        <SelectItem key={t.address} value={t.address}>
                                            <div className="flex items-center gap-2">
                                                {t.logo && (
                                                    <img
                                                        src={t.logo}
                                                        alt={t.symbol}
                                                        className="h-4 w-4 rounded-full"
                                                    />
                                                )}
                                                <span>{t.symbol}</span>
                                                <span className="text-muted-foreground text-xs">({t.name})</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date *</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description / Items</Label>
                        <Textarea
                            id="description"
                            placeholder="Invoice for consulting services, etc..."
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/invoices">Cancel</Link>
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending || !recipient || !amount || !date}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isPending ? "Creating..." : "Create Invoice"}
                    </Button>
                </CardFooter>
            </Card>

            {/* Transaction Status Modal */}
            <TransactionModal
                isOpen={txState !== 'idle'}
                onClose={handleCancel}
                onCancel={handleCancel}
                state={txState}
                title="Creating Invoice"
                description="Creating your invoice on Mantle..."
                txHash={hash}
                error={txError}
                successMessage="Your invoice has been created on-chain!"
                onSuccessAction={() => router.push("/invoices")}
                successActionLabel="View Invoices"
            />
        </div>
    );
}

