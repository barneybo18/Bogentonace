"use client";

import { useInvoice } from "@/hooks/useInvoices";
import { usePayInvoice } from "@/hooks/usePayInvoice";
import { useWallet } from "@solana/wallet-adapter-react";
const useAccount = () => { const { publicKey, connected } = useWallet(); return { address: publicKey?.toString(), isConnected: connected }; };
const useChainId = () => 1;
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { formatId } from "@/lib/utils";
import {
    ChevronLeft,
    Loader2,
    CheckCircle,
    Copy,
    Check,
    Share2,
    User,
    Wallet,
    Calendar,
    Clock,
    Coins,
    ExternalLink,
    FileText,
    XCircle
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function InvoiceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const invoiceId = params.id ? BigInt(params.id as string) : undefined;

    const { isConnected, address } = useAccount();
    const { invoice, isLoading, refetch } = useInvoice(invoiceId);
    const { payInvoice, isPending: paying } = usePayInvoice();
    const [copied, setCopied] = useState<string | null>(null);

    const handlePay = async () => {
        if (!invoice) return;
        try {
            await payInvoice(invoice.id, invoice.amount);
            setTimeout(() => {
                refetch();
            }, 2000);
        } catch (e) {
            console.error(e);
        }
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const shareInvoice = () => {
        const shareUrl = `${window.location.origin}/invoices/${invoiceId?.toString()}`;
        copyToClipboard(shareUrl, 'share');
    };

    const formatDate = (timestamp: bigint) => {
        const date = new Date(Number(timestamp) * 1000);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (timestamp: bigint) => {
        const date = new Date(Number(timestamp) * 1000);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatus = () => {
        if (!invoice) return { label: 'Loading', variant: 'outline' as const, color: 'text-muted-foreground' };
        if (invoice.paid) return { label: 'Paid', variant: 'default' as const, color: 'text-green-500' };
        const now = Math.floor(Date.now() / 1000);
        if (Number(invoice.dueDate) < now) return { label: 'Overdue', variant: 'destructive' as const, color: 'text-red-500' };
        return { label: 'Pending', variant: 'outline' as const, color: 'text-yellow-500' };
    };

    const parseMetadata = () => {
        if (!invoice) return { name: null, description: '' };
        try {
            const parsed = JSON.parse(invoice.metadataHash);
            return {
                name: parsed.name || null,
                description: parsed.description || '',
            };
        } catch {
            return {
                name: null,
                description: invoice.metadataHash,
            };
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Invoice {invoiceId ? formatId(invoiceId) : ''}</h2>
                    <p className="text-muted-foreground">Connect your wallet to view this invoice</p>
                </div>
                <ConnectButton />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading invoice...</p>
            </div>
        );
    }

    if (!invoice || invoice.amount === 0n) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <FileText className="size-16 text-muted-foreground/50" />
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Invoice Not Found</h2>
                    <p className="text-muted-foreground">This invoice doesn't exist or has been removed.</p>
                </div>
                <Button asChild>
                    <Link href="/invoices">Back to Invoices</Link>
                </Button>
            </div>
        );
    }

    const status = getStatus();
    const metadata = parseMetadata();
    const isCreator = invoice.creator.toLowerCase() === address?.toLowerCase();
    const canPay = !invoice.paid && !isCreator;

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/invoices"><ChevronLeft className="size-4" /></Link>
                </Button>
                <h2 className="text-3xl font-bold tracking-tight">Invoice {formatId(invoice.id)}</h2>
                <Badge variant={status.variant} className="ml-auto">
                    {status.label}
                </Badge>
            </div>

            {/* Main Invoice Card */}
            <Card className="border-2">
                <CardHeader className="text-center pb-2">
                    <CardDescription className="text-sm">
                        {isCreator ? 'Invoice you sent' : 'Invoice for payment'}
                    </CardDescription>
                    <CardTitle className="text-4xl font-bold tracking-tight pt-4">
                        {formatEther(invoice.amount)} <span className="text-2xl text-muted-foreground">MNT</span>
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Parties */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 rounded-lg bg-muted/50 border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <User className="size-4" />
                                <span className="text-xs font-medium uppercase tracking-wider">
                                    {isCreator ? 'Pay To (You)' : 'From'}
                                </span>
                            </div>
                            {metadata.name && <p className="font-semibold">{metadata.name}</p>}
                            <div className="flex items-center gap-2">
                                <code className="text-xs font-mono bg-background px-2 py-1 rounded">
                                    {invoice.creator.slice(0, 10)}...{invoice.creator.slice(-8)}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    onClick={() => copyToClipboard(invoice.creator, 'creator')}
                                >
                                    {copied === 'creator' ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-muted/50 border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <Wallet className="size-4" />
                                <span className="text-xs font-medium uppercase tracking-wider">
                                    {isCreator ? 'Recipient' : 'Pay To'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <code className="text-xs font-mono bg-background px-2 py-1 rounded">
                                    {invoice.recipient.slice(0, 10)}...{invoice.recipient.slice(-8)}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    onClick={() => copyToClipboard(invoice.recipient, 'recipient')}
                                >
                                    {copied === 'recipient' ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {metadata.description && (
                        <div className="p-4 rounded-lg border">
                            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Description</p>
                            <p className="text-sm">{metadata.description}</p>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-3 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Clock className="size-4" />
                                <span className="text-xs font-medium">Created</span>
                            </div>
                            <p className="text-sm font-medium">{formatDate(invoice.createdAt)}</p>
                            <p className="text-xs text-muted-foreground">{formatTime(invoice.createdAt)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Calendar className="size-4" />
                                <span className="text-xs font-medium">Due Date</span>
                            </div>
                            <p className={`text-sm font-medium ${status.color}`}>{formatDate(invoice.dueDate)}</p>
                            <p className="text-xs text-muted-foreground">{formatTime(invoice.dueDate)}</p>
                        </div>
                    </div>

                    {/* Token */}
                    <div className="p-3 rounded-lg border flex items-center gap-3">
                        <div className="size-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">M</span>
                        </div>
                        <div>
                            <p className="font-medium">MNT (Native Token)</p>
                            <p className="text-xs text-muted-foreground">Mantle Network</p>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={shareInvoice}
                    >
                        {copied === 'share' ? (
                            <>
                                <Check className="size-4 mr-2 text-green-500" />
                                Link Copied!
                            </>
                        ) : (
                            <>
                                <Share2 className="size-4 mr-2" />
                                Share Invoice
                            </>
                        )}
                    </Button>

                    {canPay && (
                        <Button
                            className="flex-1 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            onClick={handlePay}
                            disabled={paying}
                        >
                            {paying ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Wallet className="size-4 mr-2" />
                                    Pay {formatEther(invoice.amount)} MNT
                                </>
                            )}
                        </Button>
                    )}

                    {invoice.paid && (
                        <div className="flex-1 flex items-center justify-center gap-2 text-green-500 font-medium py-2">
                            <CheckCircle className="size-5" />
                            Invoice Paid
                        </div>
                    )}

                    {!invoice.paid && isCreator && (
                        <div className="flex-1 text-center text-muted-foreground text-sm py-2">
                            Awaiting payment from recipient
                        </div>
                    )}
                </CardFooter>
            </Card>

            {/* View on Explorer */}
            <div className="text-center">
                <Button
                    variant="link"
                    className="text-xs text-muted-foreground"
                    onClick={() => window.open(`https://explorer.sepolia.mantle.xyz/address/${invoice.creator}`, '_blank')}
                >
                    <ExternalLink className="size-3 mr-1" />
                    View on Mantle Explorer
                </Button>
            </div>
        </div>
    );
}
