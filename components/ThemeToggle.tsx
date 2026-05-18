"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch by only rendering after mount
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="size-9">
                <Sun className="size-4" />
            </Button>
        );
    }


    const isDark = resolvedTheme === "dark" || resolvedTheme === "black";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9">
                    <SunWrapper isDark={isDark} />
                    <MoonWrapper isDark={isDark} />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="size-4 mr-2" />
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="size-4 mr-2" />
                    Dark (Navy)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("black")}>
                    <Moon className="size-4 mr-2 fill-current" />
                    Black
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function SunWrapper({ isDark }: { isDark: boolean }) {
    return (
        <Sun
            className={`size-4 transition-all ${isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"}`}
        />
    );
}

function MoonWrapper({ isDark }: { isDark: boolean }) {
    return (
        <Moon
            className={`absolute size-4 transition-all ${isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`}
        />
    );
}
