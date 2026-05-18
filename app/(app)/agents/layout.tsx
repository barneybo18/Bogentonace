import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI Agents",
    description: "Deploy and manage autonomous AI payment agents for recurring crypto payments on Mantle Network.",
    openGraph: {
        title: "AI Agents | BOGENT",
        description: "Create self-funded agents that automatically execute recurring payments. Trustless automation for payroll and subscriptions.",
    },
};

export default function AgentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
