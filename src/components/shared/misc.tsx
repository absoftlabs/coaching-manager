import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ComingSoon({ icon: Icon, text = "Coming soon" }: { icon: LucideIcon; text?: string }) {
    return (
        <Card className="items-center justify-center gap-3 py-20 text-center text-muted-foreground">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Icon className="size-7" />
            </span>
            <p className="max-w-sm px-4 text-sm font-medium">{text}</p>
        </Card>
    );
}

/** Label / value row for detail views. */
export function DetailRow({ label, value, mono }: { label: string; value?: ReactNode; mono?: boolean }) {
    return (
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="text-xs font-semibold text-muted-foreground sm:w-36 sm:shrink-0 sm:text-sm sm:font-medium">{label}</dt>
            <dd className={mono ? "font-mono text-sm" : "text-sm font-semibold"}>{value || "-"}</dd>
        </div>
    );
}

export function NotFoundCard({ text }: { text: string }) {
    return <Card className="items-center py-16 text-sm text-muted-foreground">{text}</Card>;
}
