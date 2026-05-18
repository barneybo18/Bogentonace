"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StatDetailSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
}

export function StatDetailSheet({
    isOpen,
    onClose,
    title,
    description,
    children,
}: StatDetailSheetProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[70vh] p-0 gap-0 overflow-hidden backdrop-blur-xl bg-background/95 border-border/50 shadow-2xl">
                <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
                    <DialogTitle className="text-lg">{title}</DialogTitle>
                    {description && (
                        <DialogDescription className="text-sm">{description}</DialogDescription>
                    )}
                </DialogHeader>
                <ScrollArea className="max-h-[50vh] px-6 py-4">
                    {children}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
