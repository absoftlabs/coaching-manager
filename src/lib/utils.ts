import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function initials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");
}

export function formatMoney(n: number | null | undefined) {
    return `৳ ${Number(n ?? 0).toLocaleString("en-IN")}`;
}

export function formatDate(value: string | Date | null | undefined) {
    if (!value) return "-";
    const d = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | Date | null | undefined) {
    if (!value) return "-";
    const d = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/** Escapes text for safe interpolation into print-window HTML. */
export function esc(v: unknown): string {
    return String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/** Reads a JSON error message from a failed fetch response. */
export async function readError(res: Response, fallback: string): Promise<string> {
    const j = (await res.json().catch(() => null)) as { error?: string } | null;
    return j?.error || fallback;
}
