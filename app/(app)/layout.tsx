"use client";

import { AppSidebar, MobileMenuTrigger } from "@/components/AppSidebar";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { SolPrice } from "@/components/SolPrice";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Load WalletMultiButton only on the client — it reads wallet state that
// differs between server (no wallet) and client (wallet connected/detected),
// which causes a React hydration mismatch if rendered during SSR.
const WalletMultiButton = dynamic(
    async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
    { ssr: false }
);

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Prevent any wallet-dependent UI from rendering until client is mounted
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div className="flex h-screen w-full bg-background">
            <AppSidebar />
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <header className="h-14 border-b px-2 sm:px-4 md:px-6 flex items-center justify-between bg-card gap-1 sm:gap-2 overflow-x-auto">
                    <div className="flex items-center gap-2 shrink-0">
                        <MobileMenuTrigger />
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
                        <SolPrice />
                        <ThemeToggle />
                        {mounted && <NetworkSwitcher />}
                        {/* WalletMultiButton is client-only (ssr: false) to prevent hydration mismatch */}
                        <WalletMultiButton />
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-4 md:p-6">
                    {children}
                </div>
            </main>
            <Toaster richColors position="top-right" />
        </div>
    );
}
