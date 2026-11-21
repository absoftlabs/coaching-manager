import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getOrgInfo } from "@/lib/settings";
import { getSession } from "@/lib/session";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export async function generateMetadata(): Promise<Metadata> {
    const org = await getOrgInfo();
    return {
        title: { default: org.name, template: `%s · ${org.name}` },
        description: "Coaching management — students, teachers, attendance, results, fees and SMS.",
        icons: { icon: "/icon.svg" },
        appleWebApp: { capable: true, title: "Coaching Manager", statusBarStyle: "default" },
    };
}

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#fbfaf6" },
        { media: "(prefers-color-scheme: dark)", color: "#14191e" },
    ],
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const [org, session] = await Promise.all([getOrgInfo(), getSession()]);
    const user = session ? { username: session.username, role: session.role } : null;

    return (
        <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${jetbrains.variable}`}>
            <body className="font-sans">
                <Providers org={org} user={user}>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
