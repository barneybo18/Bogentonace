"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { getExplorerUrl } from "@/lib/network";
import { useNetwork } from "@/components/NetworkProvider";

import Image from "next/image";

export type TransactionState = 'idle' | 'confirming' | 'pending' | 'success' | 'error';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCancel?: () => void;
    state: TransactionState;
    title?: string;
    description?: string;
    txHash?: string;
    error?: string;
    successMessage?: string;
    onSuccessAction?: () => void;
    successActionLabel?: string;
}

export function TransactionModal({
    isOpen,
    onClose,
    onCancel,
    state,
    title = "Transaction",
    description,
    txHash,
    error,
    successMessage = "Transaction confirmed successfully!",
    onSuccessAction,
    successActionLabel = "Continue"
}: TransactionModalProps) {
    const { network } = useNetwork();
    
    // Parse error message to be user-friendly
    const getFriendlyError = (errorMsg?: string) => {
        if (!errorMsg) return "Something went wrong. Please try again.";

        const lowerError = errorMsg.toLowerCase();

        // User cancelled/rejected the transaction
        if (lowerError.includes('user denied') ||
            lowerError.includes('user rejected') ||
            lowerError.includes('denied request signature') ||
            lowerError.includes('user cancelled')) {
            return "You cancelled the transaction.";
        }

        // Insufficient funds
        if (lowerError.includes('insufficient funds') || lowerError.includes('insufficient balance')) {
            return "Insufficient funds in your wallet.";
        }

        // Gas estimation failed
        if (lowerError.includes('gas') && lowerError.includes('estimation')) {
            return "Transaction would fail. Please check your inputs.";
        }

        // Network issues
        if (lowerError.includes('network') || lowerError.includes('timeout')) {
            return "Network error. Please try again.";
        }

        // Default: truncate long errors
        if (errorMsg.length > 100) {
            return "Transaction failed. Please try again.";
        }

        return errorMsg;
    };

    const getContent = () => {
        switch (state) {
            case 'confirming':
                return {
                    icon: <Image src="/bogent-loading.gif" alt="Loading" width={80} height={80} unoptimized />,
                    title: "Waiting for Confirmation",
                    description: description || "Please confirm the transaction in your wallet...",
                    showCancel: true
                };
            case 'pending':
                return {
                    icon: <Image src="/bogent-loading.gif" alt="Loading" width={80} height={80} unoptimized />,
                    title: "Transaction Pending",
                    description: "Waiting for blockchain confirmation...",
                    showCancel: false
                };
            case 'success':
                return {
                    icon: <Image src="/bogent-success.png" alt="Success" width={80} height={80} />,
                    title: "Success!",
                    description: successMessage,
                    showCancel: false
                };
            case 'error':
                const isCancelled = error?.toLowerCase().includes('denied') ||
                    error?.toLowerCase().includes('rejected') ||
                    error?.toLowerCase().includes('cancelled');
                return {
                    icon: <Image src="/bogent-error.png" alt="Error" width={80} height={80} />,
                    title: isCancelled ? "Transaction Cancelled" : "Transaction Failed",
                    description: getFriendlyError(error),
                    showCancel: false
                };
            default:
                return null;
        }
    };

    const content = getContent();

    if (!content || state === 'idle') return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && state !== 'pending' && onClose()}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => { if (state === 'pending' || state === 'confirming') e.preventDefault(); }}>
                <DialogHeader className="text-center sm:text-center">
                    <div className="flex justify-center mb-4">
                        {content.icon}
                    </div>
                    <DialogTitle className="text-xl">{content.title}</DialogTitle>
                    <DialogDescription className="text-center">
                        {content.description}
                    </DialogDescription>
                </DialogHeader>

                {txHash && (state === 'pending' || state === 'success') && (
                    <div className="flex justify-center">
                        <a
                            href={getExplorerUrl("tx/" + txHash, network)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                            View on Solana Explorer
                            <ExternalLink className="size-3" />
                        </a>
                    </div>
                )}

                <DialogFooter className="sm:justify-center gap-2">
                    {content.showCancel && onCancel && (
                        <Button variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    {state === 'success' && onSuccessAction && (
                        <Button onClick={() => {
                            onClose();
                            onSuccessAction();
                        }}>
                            {successActionLabel}
                        </Button>
                    )}
                    {state === 'error' && (
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

