"use client";

import { createContext, useContext, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/shared/confirm";
import type { Role } from "@/lib/auth";

export type ClientOrg = { name: string; phone: string; address: string; logo: string | null };
export type ClientUser = { username: string; role: Role } | null;

const AppContext = createContext<{ org: ClientOrg; user: ClientUser } | null>(null);

export function Providers({ org, user, children }: { org: ClientOrg; user: ClientUser; children: ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AppContext.Provider value={{ org, user }}>
                <ConfirmProvider>
                    {children}
                    <Toaster />
                </ConfirmProvider>
            </AppContext.Provider>
        </ThemeProvider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used inside <Providers>");
    return ctx;
}

/** Logo URL to show, falling back to a generated monogram. */
export function useOrgLogo(): string {
    const { org } = useApp();
    return org.logo || "/icon.svg";
}
