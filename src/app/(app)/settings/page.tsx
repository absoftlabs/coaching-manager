import { SettingsView } from "@/components/settings/settings-view";
import { getAdminSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Settings" };

export default async function Page() {
    const [settings, admins] = await Promise.all([
        getAdminSettings(),
        prisma.admin.findMany({ where: { role: "admin" }, orderBy: { createdAt: "asc" } }),
    ]);
    return (
        <SettingsView
            settings={settings}
            admins={admins.map((a) => ({ id: a.id, email: a.email, username: a.username, createdAt: a.createdAt.toISOString() }))}
        />
    );
}
