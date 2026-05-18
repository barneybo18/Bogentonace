import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "View your BOGENT dashboard - track payments, invoices, and AI agents on Mantle Network.",
    openGraph: {
        title: "Dashboard | BOGENT",
        description: "Manage your autonomous payment agents and track crypto payments on Mantle Network.",
    },
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
