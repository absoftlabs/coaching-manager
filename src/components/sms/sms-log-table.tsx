"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SmsLogDTO } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

function statusVariant(s: string) {
    if (s === "sent") return "success" as const;
    if (s === "failed") return "destructive" as const;
    return "warning" as const;
}

export function SmsLogTable({
    title,
    logs,
    loading,
    onRefresh,
    audience,
}: {
    title: string;
    logs: SmsLogDTO[];
    loading: boolean;
    onRefresh: () => void;
    audience: "student" | "teacher";
}) {
    const [q, setQ] = useState("");
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return logs;
        return logs.filter((l) =>
            [l.preview, l.phone, l.studentId ?? "", l.teacherId ?? "", l.batchName ?? "", l.status].some((v) =>
                v.toLowerCase().includes(s)
            )
        );
    }, [logs, q]);

    return (
        <Card>
            <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>{title}</CardTitle>
                <div className="flex gap-2">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Search logs" value={q} onChange={(e) => setQ(e.target.value)} />
                    </div>
                    <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading} aria-label="Refresh">
                        <RefreshCw className={loading ? "animate-spin" : ""} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {filtered.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">No logs</p>
                ) : (
                    <ul className="divide-y overflow-hidden rounded-xl border">
                        {filtered.map((l) => (
                            <li key={l.id} className="space-y-1.5 px-3 py-3">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    <Badge variant={statusVariant(l.status)}>{l.status}</Badge>
                                    <span className="font-mono text-foreground">{l.phone || "—"}</span>
                                    {audience === "student" ? (
                                        <span>
                                            {l.batchName ?? "-"} · <span className="font-mono">{l.studentId ?? "-"}</span>
                                        </span>
                                    ) : (
                                        <span>{l.teacherId ?? "-"}</span>
                                    )}
                                    <span className="ml-auto">{formatDateTime(l.sentAt)}</span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{l.preview}</p>
                                {l.status === "failed" && l.error && <p className="text-xs text-destructive">{l.error}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
