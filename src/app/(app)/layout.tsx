import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    // Middleware already guards these routes; this is a second line of defence.
    if (!(await getSession())) redirect("/login");
    return <AppShell>{children}</AppShell>;
}
