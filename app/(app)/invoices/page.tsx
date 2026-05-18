"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { Plus, Loader2, FileText, CheckCircle, Share2, Eye, XCircle, Copy, Check, MoreHorizontal } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { usePayInvoice } from "@/hooks/usePayInvoice";
import { useCancelInvoice } from "@/hooks/useCancelInvoice";
import { useWallet } from "@solana/wallet-adapter-react";
import { formatEther } from "viem";
import { formatId } from "@/lib/utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect, Suspense } from "react";
import { InvoiceTableSkeleton } from "@/components/InvoiceTableSkeleton";
import { InvoiceDetailModal } from "@/components/InvoiceDetailModal";
import { motion, AnimatePresence } from "framer-motion";
import { Invoice } from "@/lib/contracts";
import { useSearchParams } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function InvoicesContent() {
    const { isConnected, address } = useAccount();
    const { invoices, isLoading, refetch } = useInvoices();
    const { payInvoice, isPending: paying, isSuccess: paySuccess } = usePayInvoice();
    const { cancelInvoice, isPending: cancelling, isSuccess: cancelSuccess } = useCancelInvoice();
    const [payingId, setPayingId] = useState<bigint | null>(null);
    const [cancellingId, setCancellingId] = useState<bigint | null>(null);

    // Use ID for selection to ensure data stays fresh on refetch
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<bigint | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const searchParams = useSearchParams();

    // Derived selected invoice from fresh data
    const selectedInvoice = selectedInvoiceId !== null
        ? invoices.find(inv => inv.id === selectedInvoiceId) || null
        : null;

    // Handle invoice ID from URL query params (for shared invoices)
    useEffect(() => {
        const invoiceIdParam = searchParams.get('id');
        if (invoiceIdParam) {
            // valid ID?
            const id = BigInt(invoiceIdParam);
            // Only set if we haven't set it yet or it's different (and exists in list check is optional but good UX)
            // But we might load list later.
            setSelectedInvoiceId(id);
        }
    }, [searchParams]);

    // Clear paying state when transaction completes
    useEffect(() => {
        if (paySuccess && payingId !== null) {
            setPayingId(null);
        }
    }, [paySuccess, payingId]);

    // Clear cancelling state when transaction completes
    useEffect(() => {
        if (cancelSuccess && cancellingId !== null) {
            setCancellingId(null);
        }
    }, [cancelSuccess, cancellingId]);


    const handlePay = async (invoiceId: bigint, amount: bigint) => {
        setPayingId(invoiceId);
        try {
            const success = await payInvoice(invoiceId, amount);
            // Hook automatically invalidates cache on transaction confirmation
            // Keep payingId until hook's isPending becomes false
            if (!success) {
                setPayingId(null);
            }
        } catch (e) {
            setPayingId(null);
        }
    };

    const handleCancel = async (invoiceId: bigint) => {
        setCancellingId(invoiceId);
        try {
            const success = await cancelInvoice(invoiceId);
            // Hook automatically invalidates cache on transaction confirmation
            if (!success) {
                setCancellingId(null);
            }
        } catch (e) {
            setCancellingId(null);
        }
    };

    const formatDate = (timestamp: bigint) => {
        const date = new Date(Number(timestamp) * 1000);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const copyInvoiceDetails = (invoice: Invoice) => {
        const metadata = parseMetadata(invoice.metadataHash);
        const amount = formatEther(invoice.amount);
        const shareUrl = `${window.location.origin}/invoices/${invoice.id.toString()}`;

        const details = [
            `═══════════════════════════════`,
            `        BOGENT INVOICE         `,
            `═══════════════════════════════`,
            ``,
            `Invoice ID: #${invoice.id.toString().padStart(4, '0')}`,
            `Amount: ${amount} MNT`,
            ``,
            `From: ${metadata.name || 'Unknown'}`,
            `Address: ${invoice.creator}`,
            ``,
            `To: ${invoice.recipient}`,
            ``,
        ];
        if (metadata.description) {
            details.push(`Memo: ${metadata.description}`);
            details.push(``);
        }
        details.push(`Due Date: ${formatDate(invoice.dueDate)}`);
        details.push(`Status: ${invoice.paid ? 'Paid' : 'Pending'}`);
        details.push(``);
        details.push(`═══════════════════════════════`);
        details.push(`Pay at: ${shareUrl}`);
        details.push(`═══════════════════════════════`);

        navigator.clipboard.writeText(details.join('\n'));
        setCopiedId(invoice.id.toString());
        setTimeout(() => setCopiedId(null), 2000);
    };

    const parseMetadata = (metadataHash: string) => {
        try {
            const parsed = JSON.parse(metadataHash);
            return {
                name: parsed.name || null,
                description: parsed.description || '',
            };
        } catch {
            return {
                name: null,
                description: metadataHash,
            };
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
                    <p className="text-muted-foreground">Connect your wallet to view invoices</p>
                </div>
                <ConnectButton />
            </div>
        );
    }

    const getStatus = (invoice: { paid: boolean; dueDate: bigint }) => {
        if (invoice.paid) return { label: 'Paid', variant: 'default' as const };
        const now = Math.floor(Date.now() / 1000);
        if (Number(invoice.dueDate) < now) return { label: 'Overdue', variant: 'destructive' as const };
        return { label: 'Pending', variant: 'outline' as const };
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
                <Button asChild>
                    <Link href="/invoices/new">
                        <Plus className="mr-2 h-4 w-4" /> Create Invoice
                    </Link>
                </Button>
            </div>

            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-md border"
                    >
                        <InvoiceTableSkeleton />
                    </motion.div>
                ) : invoices.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16 border-2 border-dashed rounded-lg space-y-4"
                    >
                        <Image
                            src="/bogent-empty.png"
                            alt="No invoices"
                            width={120}
                            height={120}
                            className="mx-auto"
                        />
                        <p className="text-muted-foreground">No invoices yet</p>
                        <Button asChild>
                            <Link href="/invoices/new">Create your first invoice</Link>
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-md border"
                    >
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Payee</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((invoice, idx) => {
                                    const status = getStatus(invoice);
                                    const isCreator = invoice.creator.toLowerCase() === address?.toLowerCase();
                                    const canPay = !invoice.paid && !isCreator;
                                    const canCancel = !invoice.paid && isCreator;
                                    const metadata = parseMetadata(invoice.metadataHash);

                                    return (
                                        <motion.tr
                                            key={invoice.id.toString()}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                                            onClick={() => setSelectedInvoiceId(invoice.id)}
                                        >
                                            <TableCell className="font-mono text-xs">{formatId(invoice.id)}</TableCell>
                                            <TableCell>
                                                <Badge variant={isCreator ? "secondary" : "outline"}>
                                                    {isCreator ? 'Sent' : 'Received'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    {metadata.name && (
                                                        <span className="font-medium text-sm">{metadata.name}</span>
                                                    )}
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {isCreator
                                                            ? `${invoice.recipient.slice(0, 6)}...${invoice.recipient.slice(-4)}`
                                                            : `${invoice.creator.slice(0, 6)}...${invoice.creator.slice(-4)}`
                                                        }
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatEther(invoice.amount)} MNT
                                            </TableCell>
                                            <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    {/* Quick Pay Button */}
                                                    {canPay && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handlePay(invoice.id, invoice.amount)}
                                                            disabled={paying && payingId === invoice.id}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            {paying && payingId === invoice.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                'Pay'
                                                            )}
                                                        </Button>
                                                    )}

                                                    {invoice.paid && (
                                                        <span className="text-green-500 text-sm flex items-center gap-1">
                                                            <CheckCircle className="size-3" /> Paid
                                                        </span>
                                                    )}

                                                    {/* Quick Cancel Button for creators */}
                                                    {canCancel && (
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleCancel(invoice.id)}
                                                            disabled={cancelling && cancellingId === invoice.id}
                                                        >
                                                            {cancelling && cancellingId === invoice.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                'Cancel'
                                                            )}
                                                        </Button>
                                                    )}

                                                    {/* Actions Dropdown */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-8">
                                                                <MoreHorizontal className="size-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setSelectedInvoiceId(invoice.id)}>
                                                                <Eye className="size-4 mr-2" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => copyInvoiceDetails(invoice)}>
                                                                {copiedId === invoice.id.toString() ? (
                                                                    <>
                                                                        <Check className="size-4 mr-2 text-green-500" />
                                                                        Copied!
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Share2 className="size-4 mr-2" />
                                                                        Share Invoice
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            {canCancel && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-red-500 focus:text-red-500"
                                                                        onClick={() => handleCancel(invoice.id)}
                                                                        disabled={cancellingId === invoice.id}
                                                                    >
                                                                        {cancellingId === invoice.id ? (
                                                                            <Loader2 className="size-4 mr-2 animate-spin" />
                                                                        ) : (
                                                                            <XCircle className="size-4 mr-2" />
                                                                        )}
                                                                        Cancel Invoice
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
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

            {/* Invoice Detail Modal */}
            <InvoiceDetailModal
                invoice={selectedInvoice}
                isOpen={!!selectedInvoice}
                onClose={() => setSelectedInvoiceId(null)}
                userAddress={address}
                onPay={handlePay}
                onCancel={handleCancel}
                isPaying={paying && payingId === selectedInvoice?.id}
                isCancelling={cancellingId === selectedInvoice?.id}
            />

            {/* Copy Success Toast */}
            <AnimatePresence>
                {copiedId && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div className="flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-full shadow-lg shadow-green-600/30">
                            <Check className="size-5" />
                            <span className="font-medium">Invoice details copied to clipboard!</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function InvoicesPage() {
    return (
        <Suspense fallback={<InvoiceTableSkeleton />}>
            <InvoicesContent />
        </Suspense>
    );
}

