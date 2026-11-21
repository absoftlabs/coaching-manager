// Small presentational primitives: Skeleton, Alert, Avatar, Separator.
import * as React from "react";
import { cn, initials } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("animate-pulse rounded-lg bg-muted", className)} {...props} />;
}

export function Alert({
    className,
    variant = "default",
    ...props
}: React.ComponentProps<"div"> & { variant?: "default" | "destructive" | "success" }) {
    return (
        <div
            role="alert"
            className={cn(
                "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
                variant === "destructive" && "border-destructive/30 bg-destructive/8 text-destructive",
                variant === "success" && "border-success/30 bg-success/10 text-success",
                variant === "default" && "bg-muted/50",
                className
            )}
            {...props}
        />
    );
}

export function Avatar({
    src,
    name,
    className,
}: {
    src?: string | null;
    name: string;
    className?: string;
}) {
    return (
        <span
            className={cn(
                "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent text-sm font-bold text-accent-foreground",
                className
            )}
        >
            {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={name} className="size-full object-cover" />
            ) : (
                initials(name) || "?"
            )}
        </span>
    );
}

export function Separator({ className, vertical }: { className?: string; vertical?: boolean }) {
    return <div className={cn("shrink-0 bg-border", vertical ? "h-full w-px" : "h-px w-full", className)} />;
}
