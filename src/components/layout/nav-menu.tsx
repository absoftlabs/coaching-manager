"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getNavForRole, isNavGroup, type NavGroup } from "@/lib/nav";
import { useApp } from "@/components/providers";
import { cn } from "@/lib/utils";

function groupHas(group: NavGroup, pathname: string) {
    return group.items.some((i) => i.href === pathname);
}

/** Sidebar navigation (used in the desktop rail and the mobile drawer). */
export function NavMenu({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { user } = useApp();
    const nav = getNavForRole(user?.role ?? "admin");

    const [open, setOpen] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(nav.filter(isNavGroup).map((g) => [g.label, groupHas(g, pathname)]))
    );

    // Expand (never collapse) the group that holds the active page.
    useEffect(() => {
        setOpen((prev) => {
            const active = nav.filter(isNavGroup).find((g) => groupHas(g, pathname));
            return active && !prev[active.label] ? { ...prev, [active.label]: true } : prev;
        });
    }, [pathname, nav]);

    const itemBase =
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-muted/50";

    return (
        <nav className="flex flex-col gap-0.5">
            {nav.map((entry) => {
                if (!isNavGroup(entry)) {
                    const active = pathname === entry.href;
                    return (
                        <Link
                            key={entry.href}
                            href={entry.href}
                            onClick={onNavigate}
                            className={cn(
                                itemBase,
                                active
                                    ? "bg-sidebar-foreground text-sidebar"
                                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            )}
                        >
                            <entry.icon className="size-[18px] shrink-0" />
                            {entry.label}
                        </Link>
                    );
                }

                const isOpen = open[entry.label] ?? false;
                const hasActive = groupHas(entry, pathname);
                return (
                    <div key={entry.label}>
                        <button
                            type="button"
                            onClick={() => setOpen((p) => ({ ...p, [entry.label]: !isOpen }))}
                            aria-expanded={isOpen}
                            className={cn(
                                itemBase,
                                "w-full text-left hover:bg-sidebar-accent",
                                hasActive ? "text-sidebar-foreground" : "text-sidebar-foreground/85"
                            )}
                        >
                            <entry.icon className="size-[18px] shrink-0" />
                            <span className="flex-1">{entry.label}</span>
                            <ChevronRight
                                className={cn("size-4 text-sidebar-muted transition-transform", isOpen && "rotate-90")}
                            />
                        </button>
                        {isOpen && (
                            <div className="my-0.5 ml-[21px] flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                                {entry.items.map((item) => {
                                    const active = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onNavigate}
                                            className={cn(
                                                "rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                                                active
                                                    ? "bg-sidebar-accent font-bold text-sidebar-foreground"
                                                    : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                                            )}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
