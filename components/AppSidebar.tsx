"use client"

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, Bot, Menu, History } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Invoices",
        url: "/invoices",
        icon: FileText,
    },
    {
        title: "Agents",
        url: "/agents",
        icon: Bot,
    },
];

// Mobile menu trigger button
export function MobileMenuTrigger() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <Image
                                src="/bogent-logo.png"
                                alt="Bogent"
                                width={32}
                                height={32}
                                className="rounded"
                            />
                            <span>Bogent</span>
                        </Link>
                    </SheetTitle>
                </SheetHeader>
                <nav className="grid gap-1 p-4">
                    {items.map((item) => (
                        <Link
                            key={item.title}
                            href={item.url}
                            onClick={() => setOpen(false)}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                                pathname === item.url ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="size-4" />
                            {item.title}
                        </Link>
                    ))}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        Hackathon
                    </div>
                    <ThemeToggle />
                </div>
            </SheetContent>
        </Sheet>
    );
}

// Desktop sidebar (hidden on mobile)
export function AppSidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden md:flex h-screen w-64 flex-col border-r bg-card text-card-foreground">
            <Link href="/" className="p-4 border-b flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image
                    src="/bogent-logo.png"
                    alt="Bogent"
                    width={32}
                    height={32}
                    className="rounded"
                />
                <span className="font-bold text-lg">Bogent</span>
            </Link>
            <div className="flex-1 py-4">
                <nav className="grid gap-1 px-2">
                    {items.map((item) => (
                        <Link
                            key={item.title}
                            href={item.url}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                                pathname === item.url ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="size-4" />
                            {item.title}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="p-4 border-t flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    Bogent
                </div>
                <ThemeToggle />
            </div>
        </div>
    );
}
