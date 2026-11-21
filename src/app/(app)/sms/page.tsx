import Link from "next/link";
import { MessageSquarePlus, MessagesSquare, Send } from "lucide-react";
import { Card } from "@/components/ui/card";

export const metadata = { title: "SMS" };

const LINKS = [
    { href: "/sms/templates", label: "SMS Templates", desc: "Create reusable messages with variables", icon: MessageSquarePlus },
    { href: "/sms/students", label: "SMS Students", desc: "Send result SMS to guardians", icon: MessagesSquare },
    { href: "/sms/teachers", label: "SMS Teachers", desc: "Send a custom message to teachers", icon: Send },
];

export default function Page() {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {LINKS.map((l) => (
                <Link key={l.href} href={l.href}>
                    <Card className="h-full gap-2 px-5 transition-colors hover:border-primary">
                        <l.icon className="size-6 text-primary" />
                        <div className="font-bold">{l.label}</div>
                        <div className="text-sm text-muted-foreground">{l.desc}</div>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
