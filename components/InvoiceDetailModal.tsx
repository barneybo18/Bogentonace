"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Invoice } from "@/lib/contracts";
import { formatEther } from "viem";
import { formatId } from "@/lib/utils";
import {
    Copy,
    Check,
    ExternalLink,
    Share2,
    User,
    Wallet,
    Calendar,
    Clock,
    FileText,
    Coins,
    XCircle,
    Download,
    MessageCircle,
    Send,
    Twitter,
    Link2,
    Loader2,
} from "lucide-react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toBlob } from "html-to-image";

interface InvoiceDetailModalProps {
    invoice: Invoice | null;
    isOpen: boolean;
    onClose: () => void;
    userAddress?: string;
    onPay?: (invoiceId: bigint, amount: bigint) => Promise<void>;
    onCancel?: (invoiceId: bigint) => Promise<void>;
    isPaying?: boolean;
    isCancelling?: boolean;
}

export function InvoiceDetailModal({
    invoice,
    isOpen,
    onClose,
    userAddress,
    onPay,
    onCancel,
    isPaying = false,
    isCancelling = false,
}: InvoiceDetailModalProps) {
    const [copied, setCopied] = useState<string | null>(null);
    const posterRef = useRef<HTMLDivElement>(null);

    if (!invoice) return null;

    const isCreator = invoice.creator.toLowerCase() === userAddress?.toLowerCase();
    const canPay = !invoice.paid && !isCreator;
    const canCancel = !invoice.paid && isCreator;

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
        if (invoice.paid) return { label: 'Paid', variant: 'default' as const, color: 'text-green-500' };
        const now = Math.floor(Date.now() / 1000);
        if (Number(invoice.dueDate) < now) return { label: 'Overdue', variant: 'destructive' as const, color: 'text-red-500' };
        return { label: 'Pending', variant: 'outline' as const, color: 'text-yellow-500' };
    };

    const status = getStatus();

    const parseMetadata = () => {
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

    const metadata = parseMetadata();

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const getShareUrl = () => `${window.location.origin}/invoices/${invoice.id.toString()}`;

    const getShareMessage = () => {
        const amount = formatEther(invoice.amount);
        const lines = [
            `💰 Invoice Request on Bogent`,
            ``,
            `📋 Invoice ID: ${formatId(invoice.id)}`,
            `💵 Amount: ${amount} MNT`,
        ];
        if (metadata.name) lines.push(`👤 From: ${metadata.name}`);
        if (metadata.description) lines.push(`📝 Memo: ${metadata.description}`);
        lines.push(`📅 Due: ${formatDate(invoice.dueDate)}`);
        lines.push(``);
        lines.push(`🔗 Pay now: ${getShareUrl()}`);
        return lines.join('\n');
    };

    const getFullInvoiceDetails = () => {
        const amount = formatEther(invoice.amount);
        const lines = [
            `═══════════════════════════════`,
            `        BOGENT INVOICE         `,
            `═══════════════════════════════`,
            ``,
            `Invoice ID: ${formatId(invoice.id)}`,
            `Amount: ${amount} MNT`,
            ``,
            `From: ${metadata.name || 'Unknown'}`,
            `Creator Address: ${invoice.creator}`,
            ``,
            `To: ${invoice.recipient}`,
            ``,
        ];
        if (metadata.description) {
            lines.push(`Memo: ${metadata.description}`);
            lines.push(``);
        }
        lines.push(`Created: ${formatDate(invoice.createdAt)} at ${formatTime(invoice.createdAt)}`);
        lines.push(`Due Date: ${formatDate(invoice.dueDate)} at ${formatTime(invoice.dueDate)}`);
        lines.push(`Status: ${status.label}`);
        lines.push(``);
        lines.push(`═══════════════════════════════`);
        lines.push(`Pay at: ${getShareUrl()}`);
        lines.push(`═══════════════════════════════`);
        return lines.join('\n');
    };

    const copyInvoiceDetails = () => {
        copyToClipboard(getFullInvoiceDetails(), 'details');
    };

    const copyShareLink = () => {
        copyToClipboard(getShareUrl(), 'share');
    };

    const generatePosterBlob = async () => {
        if (!posterRef.current) return null;

        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const blob = await toBlob(posterRef.current, {
                cacheBust: true,
                skipFonts: true,
                backgroundColor: '#0f172a',
                width: 600,
                height: 800,
                pixelRatio: 2,
                filter: (node) => {
                    return node.tagName !== 'LINK' && node.tagName !== 'STYLE';
                }
            });
            return blob;
        } catch (err) {
            console.error("Poster generation failed", err);
            alert("Could not generate poster image. Please try downloading it directly.");
            return null;
        }
    };

    const downloadAsImage = async () => {
        const blob = await generatePosterBlob();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `Invoice-${formatId(invoice.id)}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    const shareWithImage = async () => {
        const blob = await generatePosterBlob();
        if (!blob) return;
        const file = new File([blob], `invoice-${formatId(invoice.id)}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `Invoice ${formatId(invoice.id)}`,
                    text: getShareMessage(),
                });
            } catch (e) {
                console.log('Share cancelled');
            }
        } else {
            downloadAsImage();
        }
    };

    const shareToWhatsApp = () => {
        const message = getShareMessage();
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const shareToTelegram = () => {
        const message = getShareMessage();
        const url = `https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const shareToTwitter = () => {
        const amount = formatEther(invoice.amount);
        const text = `💰 Invoice for ${amount} MNT | ID: ${formatId(invoice.id)}${metadata.description ? ` | ${metadata.description}` : ''} | Pay via @BogentHQ`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getShareUrl())}`;
        window.open(url, '_blank');
    };

    const nativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Invoice ${formatId(invoice.id)}`,
                    text: getShareMessage(),
                    url: getShareUrl(),
                });
            } catch (e) {
            }
        }
    };

    const handlePay = async () => {
        if (onPay) {
            await onPay(invoice.id, invoice.amount);
        }
    };

    const handleCancel = async () => {
        if (onCancel) {
            await onCancel(invoice.id);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <FileText className="size-5" />
                            Invoice {formatId(invoice.id)}
                        </DialogTitle>
                        <Badge variant={status.variant} className="text-xs">
                            {status.label}
                        </Badge>
                    </div>
                    <DialogDescription>
                        {isCreator ? 'You created this invoice' : 'You received this invoice'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Amount Section */}
                    <div className="text-center p-6 rounded-xl bg-linear-to-br from-primary/10 to-primary/5 border">
                        <Coins className="size-8 mx-auto mb-2 text-primary" />
                        <p className="text-sm text-muted-foreground mb-1">Amount</p>
                        <p className="text-4xl font-bold tracking-tight">
                            {formatEther(invoice.amount)} <span className="text-xl text-muted-foreground">MNT</span>
                        </p>
                    </div>

                    {/* Sender Info */}      

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <User className="size-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">
                                    {isCreator ? 'Sent to (Payee)' : 'Invoice From'}
                                </p>
                                {metadata.name && (
                                    <p className="font-semibold text-lg truncate">{metadata.name}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                    <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                                        {isCreator
                                            ? `${invoice.recipient.slice(0, 10)}...${invoice.recipient.slice(-8)}`
                                            : `${invoice.creator.slice(0, 10)}...${invoice.creator.slice(-8)}`
                                        }
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-6"
                                        onClick={() => copyToClipboard(isCreator ? invoice.recipient : invoice.creator, 'address')}
                                    >
                                        {copied === 'address' ? (
                                            <Check className="size-3 text-green-500" />
                                        ) : (
                                            <Copy className="size-3" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Counterparty Info */}
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                            <div className="size-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                <Wallet className="size-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">
                                    {isCreator ? 'Created by (You)' : 'Pay To'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                                        {isCreator
                                            ? `${invoice.creator.slice(0, 10)}...${invoice.creator.slice(-8)}`
                                            : `${invoice.creator.slice(0, 10)}...${invoice.creator.slice(-8)}`
                                        }
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-6"
                                        onClick={() => copyToClipboard(invoice.creator, 'creator')}
                                    >
                                        {copied === 'creator' ? (
                                            <Check className="size-3 text-green-500" />
                                        ) : (
                                            <Copy className="size-3" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {metadata.description && (
                        <div className="p-4 rounded-lg border">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                            <p className="text-sm">{metadata.description}</p>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-muted/30 border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Clock className="size-4" />
                                <span className="text-xs font-medium">Created</span>
                            </div>
                            <p className="text-sm font-medium">{formatDate(invoice.createdAt)}</p>
                            <p className="text-xs text-muted-foreground">{formatTime(invoice.createdAt)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Calendar className="size-4" />
                                <span className="text-xs font-medium">Due Date</span>
                            </div>
                            <p className={`text-sm font-medium ${status.color}`}>{formatDate(invoice.dueDate)}</p>
                            <p className="text-xs text-muted-foreground">{formatTime(invoice.dueDate)}</p>
                        </div>
                    </div>

                    {/* Token Info */}
                    <div className="p-3 rounded-lg bg-muted/30 border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Token</p>
                        <div className="flex items-center gap-2">
                            {invoice.token === "0x0000000000000000000000000000000000000000" ? (
                                <>
                                    <div className="size-6 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">M</span>
                                    </div>
                                    <span className="font-medium">MNT (Native Token)</span>
                                </>
                            ) : (
                                <>
                                    <code className="text-xs font-mono">{invoice.token}</code>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        {/* Share Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex-1">
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
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuItem onClick={shareToWhatsApp}>
                                    <MessageCircle className="size-4 mr-2 text-green-500" />
                                    WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={shareToTelegram}>
                                    <Send className="size-4 mr-2 text-blue-500" />
                                    Telegram
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={shareToTwitter}>
                                    <Twitter className="size-4 mr-2 text-sky-500" />
                                    Twitter / X
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={copyShareLink}>
                                    {copied === 'share' ? (
                                        <>
                                            <Check className="size-4 mr-2 text-green-500" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Link2 className="size-4 mr-2" />
                                            Copy Link
                                        </>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={copyInvoiceDetails}>
                                    {copied === 'details' ? (
                                        <>
                                            <Check className="size-4 mr-2 text-green-500" />
                                            Details Copied!
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="size-4 mr-2" />
                                            Copy Invoice Details
                                        </>
                                    )}
                                </DropdownMenuItem>
                                {typeof window !== 'undefined' && 'share' in navigator && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={nativeShare}>
                                            <Share2 className="size-4 mr-2" />
                                            Native Share
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={shareWithImage}>
                                    <Download className="size-4 mr-2" />
                                    Share/Down Poster
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {canPay && (
                            <Button
                                className="flex-1 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                onClick={handlePay}
                                disabled={isPaying}
                            >
                                {isPaying ? (
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

                        {canCancel && (
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={handleCancel}
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <>
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="size-4 mr-2" />
                                        Cancel Invoice
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

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

=                    <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                        <div
                            ref={posterRef}
                            data-poster-root
                            style={{
                                backgroundColor: '#0f172a', 
                                color: '#ffffff',
                                width: '600px',
                                height: '800px',
                                padding: '48px',
                                boxSizing: 'border-box',
                                fontFamily: 'Arial, sans-serif',
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}
                        >
                            {/* Watermark - simple opacity */}
                            <div style={{ position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Coins size={500} color="#ffffff" />
                            </div>

                            {/* Header */}
                            <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <div style={{
                                            width: '48px', height: '48px',
                                            backgroundColor: '#0097a7', color: '#ffffff',
                                            borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 'bold', fontSize: '20px'
                                        }}>
                                            B
                                        </div>
                                        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>Bogent</h1>
                                    </div>
                                    <p style={{ color: '#94a3b8', margin: 0 }}>Autonomous Payments on Mantle</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        border: '1px solid #334155',
                                        borderRadius: '999px',
                                        padding: '4px 16px',
                                        fontSize: '18px',
                                        color: '#ffffff'
                                    }}>
                                        Invoice #{formatId(invoice.id)}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '48px' }}>
                                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <p style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', margin: 0 }}>Payment Request</p>
                                    <div style={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '16px',
                                        padding: '32px',
                                        display: 'inline-block'
                                    }}>
                                        <p style={{ fontSize: '72px', fontWeight: 'bold', letterSpacing: '-1px', color: '#ffffff', margin: 0, lineHeight: 1 }}>
                                            {formatEther(invoice.amount)} <span style={{ color: '#22d3ee', fontSize: '30px' }}>MNT</span>
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <p style={{ color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>From</p>
                                        <p style={{ fontSize: '20px', fontWeight: '500', color: '#ffffff', margin: 0 }}>{metadata.name || 'Unknown'}</p>
                                        <p style={{ color: '#64748b', fontSize: '14px', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{invoice.creator}</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'right' }}>
                                        <p style={{ color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Due Date</p>
                                        <p style={{ fontSize: '20px', fontWeight: '500', color: '#ffffff', margin: 0 }}>{formatDate(invoice.dueDate)}</p>
                                        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>{formatTime(invoice.dueDate)}</p>
                                    </div>
                                </div>

                                {metadata.description && (
                                    <div style={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '12px',
                                        padding: '24px'
                                    }}>
                                        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Memo</p>
                                        <p style={{ fontSize: '18px', color: '#ffffff', margin: '8px 0 0 0' }}>{metadata.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div style={{
                                borderTop: '1px solid #334155',
                                paddingTop: '32px',
                                position: 'relative',
                                zIndex: 10,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-end'
                            }}>
                                <div>
                                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Pay this invoice at</p>
                                    <p style={{ color: '#22d3ee', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>bogent.app</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 4px 0' }}>Powered by Mantle Network</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
