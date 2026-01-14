"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ShoppingCart,
    Factory,
    Package,
    FileText,
    Settings,
    LogOut,
} from "lucide-react";

const navItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Procurement",
        href: "/procurement",
        icon: ShoppingCart,
    },
    {
        title: "Production",
        href: "/production",
        icon: Factory,
    },
    {
        title: "Inventory",
        href: "/inventory",
        icon: Package,
    },
    {
        title: "Sales & Invoicing",
        href: "/sales",
        icon: FileText,
    },
    {
        title: "Financials",
        href: "/financials",
        icon: FileText,
    },
    {
        title: "Vouchers (CP/CR)",
        href: "/financials/vouchers",
        icon: FileText,
    },
];

export function Sidebar() {
    const pathname = usePathname();

    const [role, setRole] = useState("operator");

    useEffect(() => {
        const storedRole = localStorage.getItem("user_role");
        if (storedRole) setRole(storedRole);
    }, []);

    const filteredNavItems = navItems.filter(item => {
        // Hide Financials and Vouchers for Operators
        if (role === "operator" && (item.href.includes("/financials") || item.href.includes("/vouchers"))) {
            return false;
        }
        return true;
    });

    return (
        <aside className="hidden h-screen w-64 flex-col border-r bg-card md:flex">
            <div className="flex h-16 items-center justify-center border-b px-6">
                <div className="flex items-center gap-2 font-bold text-xl text-primary">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        A
                    </div>
                    <span>Al-Mehboob</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto py-6">
                <nav className="grid items-start px-4 text-sm font-medium gap-2">
                    {filteredNavItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    isActive
                                        ? "bg-primary text-primary-foreground hover:text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="mt-auto border-t p-4">
                <nav className="grid gap-2">
                    <Link
                        href="/settings"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                    <button
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-destructive hover:bg-muted"
                        onClick={() => console.log("Logout")}
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </nav>
            </div>
        </aside>
    );
}
