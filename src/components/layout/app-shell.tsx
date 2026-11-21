"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, LogOut, Menu, Settings } from "lucide-react";
import { toast } from "sonner";
import { NavMenu } from "@/components/layout/nav-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useApp, useOrgLogo } from "@/components/providers";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/misc";
import { MOBILE_TABS, getPageTitle } from "@/lib/nav";
import { cn } from "@/lib/utils";

function Brand() {
    const { org } = useApp();
    const logo = useOrgLogo();
    return (
        <Link href="/" className="flex items-center gap-3 px-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" className="size-10 shrink-0 rounded-xl bg-white object-cover ring-1 ring-white/15" />
            <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-extrabold text-sidebar-foreground">{org.name}</div>
                <div className="text-xs text-sidebar-muted">Coaching Manager</div>
            </div>
        </Link>
    );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
    return (
        <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
            <div className="pt-safe px-3 py-5">
                <Brand />
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-6 [scrollbar-width:thin]">
                <NavMenu onNavigate={onNavigate} />
            </div>
        </div>
    );
}

function UserMenu() {
    const { user } = useApp();
    const [busy, setBusy] = useState(false);

    async function logout() {
        setBusy(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
        } catch {
            toast.error("Logout failed");
            setBusy(false);
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar name={user?.username ?? "U"} className="size-9 rounded-xl bg-primary text-primary-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="truncate">{user?.username}</div>
                    <div className="text-xs font-normal text-muted-foreground capitalize">{user?.role}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.role === "admin" && (
                    <DropdownMenuItem asChild>
                        <Link href="/settings">
                            <Settings /> Settings
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                    <Link href="/change-password">
                        <KeyRound /> Change Password
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" disabled={busy} onSelect={logout}>
                    <LogOut /> {busy ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { user } = useApp();
    const [drawer, setDrawer] = useState(false);
    const title = getPageTitle(pathname);
    const isAdmin = user?.role === "admin";

    return (
        <div className="min-h-dvh lg:pl-64">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
                <SidebarBody />
            </aside>

            {/* Mobile drawer */}
            <Sheet open={drawer} onOpenChange={setDrawer}>
                <SheetContent side="left" className="border-0 p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <SidebarBody onNavigate={() => setDrawer(false)} />
                </SheetContent>
            </Sheet>

            {/* Top bar */}
            <header className="pt-safe sticky top-0 z-20 border-b bg-background/85 backdrop-blur-md">
                <div className="flex h-14 items-center gap-2 px-3 sm:px-5 lg:h-16 lg:px-8">
                    <button
                        type="button"
                        onClick={() => setDrawer(true)}
                        className="-ml-1 rounded-lg p-2 hover:bg-accent lg:hidden"
                        aria-label="Open menu"
                    >
                        <Menu className="size-5" />
                    </button>
                    <h1 className="truncate text-base font-extrabold tracking-tight sm:text-lg">{title}</h1>
                    <div className="ml-auto flex items-center gap-1.5">
                        <ThemeToggle />
                        <UserMenu />
                    </div>
                </div>
            </header>

            <main className={cn("mx-auto w-full max-w-7xl px-3 py-4 sm:px-5 sm:py-6 lg:px-8", isAdmin && "pb-24 lg:pb-8")}>
                {children}
            </main>

            {/* Mobile bottom tabs (admins) */}
            {isAdmin && (
                <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur-md lg:hidden">
                    <div className="grid grid-cols-5">
                        {MOBILE_TABS.map((tab) => {
                            const active = pathname === tab.href;
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={cn(
                                        "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
                                        active ? "text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                                            active && "bg-primary/12"
                                        )}
                                    >
                                        <tab.icon className="size-5" />
                                    </span>
                                    {tab.label}
                                </Link>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => setDrawer(true)}
                            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-muted-foreground"
                        >
                            <span className="flex h-7 w-12 items-center justify-center">
                                <Menu className="size-5" />
                            </span>
                            More
                        </button>
                    </div>
                </nav>
            )}
        </div>
    );
}
