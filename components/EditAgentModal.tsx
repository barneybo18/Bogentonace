"use client";

import { useState, useEffect, useMemo } from "react";
import { ScheduledPayment } from "@/lib/contracts";
import { useUpdateAgent } from "@/hooks/useUpdateAgent";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EditAgentModalProps {
    agent: ScheduledPayment;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

// Helper to calculate minimum end date based on interval
function getMinEndDate(intervalSeconds: bigint): Date {
    const now = new Date();
    const interval = Number(intervalSeconds);

    // Minute interval - one can only set termination time after 2 minutes
    if (interval <= 60) {
        return new Date(now.getTime() + 2 * 60 * 1000);
    }
    // Hourly interval - one can only set termination time after 1 hour
    if (interval <= 3600) {
        return new Date(now.getTime() + 65 * 60 * 1000); // 1 hour 5 mins
    }
    // Daily interval - one can only set termination time after 1 day
    if (interval <= 86400) {
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
    // Weekly interval - one can only set termination time after 1 week
    if (interval <= 604800) {
        return new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
    }
    // Monthly interval (~30 days) - one can only set termination time after 1 month
    return new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
}

function formatIntervalLabel(intervalSeconds: bigint): string {
    const interval = Number(intervalSeconds);
    if (interval <= 60) return "Minute";
    if (interval <= 3600) return "Hourly";
    if (interval <= 86400) return "Daily";
    if (interval <= 604800) return "Weekly";
    return "Monthly";
}

function getMinEndDateMessage(intervalSeconds: bigint): string {
    const interval = Number(intervalSeconds);
    if (interval <= 60) return "at least 2 minutes from now";
    if (interval <= 3600) return "at least 1 hour from now";
    if (interval <= 86400) return "at least 1 day from now";
    if (interval <= 604800) return "at least 8 days from now";
    return "at least 31 days from now";
}

export function EditAgentModal({ agent, isOpen, onClose, onUpdate }: EditAgentModalProps) {
    const { updateAgent, isPending, isSuccess, error, resetState } = useUpdateAgent();
    const [endDate, setEndDate] = useState("");
    const [endTime, setEndTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const minEndDate = useMemo(() => getMinEndDate(agent.interval), [agent.interval]);
    const intervalLabel = useMemo(() => formatIntervalLabel(agent.interval), [agent.interval]);
    const minEndDateMessage = useMemo(() => getMinEndDateMessage(agent.interval), [agent.interval]);

    // Format min date for input
    const minDateStr = minEndDate.toISOString().split('T')[0];
    const minTimeStr = minEndDate.toTimeString().slice(0, 5);

    // Initialize with current end date if exists
    useEffect(() => {
        if (agent.endDate && agent.endDate > 0n) {
            const date = new Date(Number(agent.endDate) * 1000);
            setEndDate(date.toISOString().split('T')[0]);
            setEndTime(date.toTimeString().slice(0, 5));
        } else {
            // Default to min end date
            setEndDate(minDateStr);
            setEndTime("12:00");
        }
    }, [agent.endDate, minDateStr]);

    useEffect(() => {
        if (isSuccess && isSubmitting) {
            toast.success("Agent updated!", { description: "Termination date has been set." });
            setIsSubmitting(false);
            resetState();
            onUpdate();
            onClose();
        }
    }, [isSuccess, isSubmitting, onUpdate, onClose, resetState]);

    useEffect(() => {
        if (error && isSubmitting) {
            toast.error("Failed to update agent", { description: error.message || "Transaction failed" });
            setIsSubmitting(false);
            resetState();
        }
    }, [error, isSubmitting, resetState]);

    const validateEndDate = (): { valid: boolean; timestamp: bigint } => {
        if (!endDate || !endTime) {
            return { valid: false, timestamp: 0n };
        }

        const selectedDateTime = new Date(`${endDate}T${endTime}`);
        const timestamp = BigInt(Math.floor(selectedDateTime.getTime() / 1000));

        if (selectedDateTime < minEndDate) {
            toast.error("Invalid termination date", {
                description: `For ${intervalLabel} agents, termination must be ${minEndDateMessage}`
            });
            return { valid: false, timestamp: 0n };
        }

        return { valid: true, timestamp };
    };

    const handleSubmit = async () => {
        const { valid, timestamp } = validateEndDate();
        if (!valid) return;

        toast.info("Updating agent...", { description: "Verifying transaction..." });
        setIsSubmitting(true);

        const result = await updateAgent(agent.id, timestamp);
        if (!result.success) {
            setIsSubmitting(false);
            toast.error("Failed to update agent", { description: result.error || "Transaction was rejected" });
        }
    };

    const handleClearEndDate = async () => {
        toast.info("Removing termination date...", { description: "Verifying transaction..." });
        setIsSubmitting(true);

        const result = await updateAgent(agent.id, 0n);
        if (!result.success) {
            setIsSubmitting(false);
            toast.error("Failed to update agent", { description: result.error || "Transaction was rejected" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Agent</DialogTitle>
                    <DialogDescription>
                        Modify your agent settings. Note that core parameters (Amount, Recipient) cannot be changed after creation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Read-Only Fields */}
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <Input value={agent.description} disabled readOnly className="bg-muted/50" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Amount</Label>
                                <Input value={agent.amount.toString()} disabled readOnly className="bg-muted/50" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Interval</Label>
                                <Input value={intervalLabel} disabled readOnly className="bg-muted/50" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Recipient</Label>
                            <Input value={agent.to} disabled readOnly className="bg-muted/50 font-mono text-xs" />
                        </div>
                    </div>

                    <div className="h-px bg-border my-2" />

                    <h4 className="font-medium text-sm">Termination Settings</h4>

                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {intervalLabel} agents can be terminated {minEndDateMessage}.
                        </AlertDescription>
                    </Alert>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="endDate">Termination Date</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    min={minDateStr}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-32"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                The agent will stop executing payments after this date.
                            </p>
                        </div>

                        {agent.endDate && agent.endDate > 0n && (
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Current Termination</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(Number(agent.endDate) * 1000).toLocaleString()}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearEndDate}
                                    disabled={isPending || isSubmitting}
                                >
                                    Remove
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isPending || isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending || isSubmitting || !endDate}>
                        {(isPending || isSubmitting) && <Loader2 className="size-4 mr-2 animate-spin" />}
                        <Calendar className="size-4 mr-2" />
                        Set Termination Date
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
