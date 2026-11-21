// "Today" is computed in the coaching center's timezone (default Asia/Dhaka),
// not UTC — otherwise attendance taken before 6am would land on yesterday.
export const APP_TIMEZONE = process.env.APP_TIMEZONE || process.env.NEXT_PUBLIC_APP_TIMEZONE || "Asia/Dhaka";

export function ymdInZone(date: Date = new Date(), timeZone: string = APP_TIMEZONE): string {
    // en-CA formats as YYYY-MM-DD
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function todayYmd(): string {
    return ymdInZone(new Date());
}

export function isYmd(v: unknown): v is string {
    return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

/** Last `days` dates (oldest first) ending today, as YYYY-MM-DD. */
export function lastNDays(days: number): string[] {
    const out: string[] = [];
    const now = Date.now();
    for (let i = days - 1; i >= 0; i--) out.push(ymdInZone(new Date(now - i * 86_400_000)));
    return out;
}
