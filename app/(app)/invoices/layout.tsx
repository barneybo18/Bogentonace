import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Invoices",
    description: "Create and manage on-chain invoices with shareable payment links on Mantle Network.",
    openGraph: {
        title: "Invoices | BOGENT",
        description: "On-chain invoice management with instant crypto payments. No middlemen, ultra-low fees.",
    },
};

export default function InvoicesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
