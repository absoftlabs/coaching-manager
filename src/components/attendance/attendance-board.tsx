"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, CheckCheck, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, Skeleton } from "@/components/ui/misc";
import { Field, SimpleSelect } from "@/components/shared/form";
import type { AttendanceDTO, AttendanceStatus, StudentDTO } from "@/lib/types";
import { todayYmd } from "@/lib/date";
import { cn } from "@/lib/utils";

async function putMark(date: string, studentId: string, status: AttendanceStatus) {
    const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, studentId, status }),
    });
    return res.ok;
}

function MarkSection({ batches, onChanged }: { batches: string[]; onChanged: () => void }) {
    const [batch, setBatch] = useState("");
    const [date, setDate] = useState(todayYmd());
    const [students, setStudents] = useState<StudentDTO[]>([]);
    const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);

    useEffect(() => {
        if (!batch) {
            setStudents([]);
            setMarks({});
            return;
        }
        let cancelled = false;
        setLoading(true);
        Promise.all([
            fetch(`/api/students?batch=${encodeURIComponent(batch)}&suspended=false`).then((r) => (r.ok ? r.json() : [])),
            fetch(`/api/attendance?date=${date}&batch=${encodeURIComponent(batch)}`).then((r) => (r.ok ? r.json() : [])),
        ])
            .then(([list, att]: [StudentDTO[], AttendanceDTO[]]) => {
                if (cancelled) return;
                setStudents([...list].sort((a, b) => a.roll.localeCompare(b.roll, undefined, { numeric: true })));
                setMarks(Object.fromEntries(att.map((a) => [a.studentId, a.status])));
            })
            .catch(() => !cancelled && setStudents([]))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [batch, date]);

    async function mark(s: StudentDTO, status: AttendanceStatus) {
        setBusy(s.studentId);
        const prev = marks[s.studentId];
        setMarks((m) => ({ ...m, [s.studentId]: status }));
        const ok = await putMark(date, s.studentId, status);
        setBusy(null);
        if (!ok) {
            setMarks((m) => ({ ...m, [s.studentId]: prev }));
            toast.error("Failed to save attendance");
            return;
        }
        onChanged();
    }

    async function markAll(status: AttendanceStatus) {
        setBusy("all");
        const res = await fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, batch, status }),
        });
        setBusy(null);
        if (!res.ok) {
            toast.error("Failed to save attendance");
            return;
        }
        setMarks(Object.fromEntries(students.map((s) => [s.studentId, status])));
        toast.success(`All marked ${status.toLowerCase()}`);
        onChanged();
    }

    const present = students.filter((s) => marks[s.studentId] === "Present").length;
    const absent = students.filter((s) => marks[s.studentId] === "Absent").length;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mark Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                    <Field label="Batch" htmlFor="att-batch">
                        <SimpleSelect id="att-batch" value={batch} onChange={setBatch} options={batches} placeholder="Select batch" />
                    </Field>
                    <Field label="Date" htmlFor="att-date">
                        <Input id="att-date" type="date" value={date} onChange={(e) => setDate(e.target.value || todayYmd())} />
                    </Field>
                </div>

                {batch && !loading && students.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
                        <div className="flex gap-2 text-sm">
                            <Badge variant="success">{present} present</Badge>
                            <Badge variant="destructive">{absent} absent</Badge>
                            <Badge variant="secondary">{students.length - present - absent} left</Badge>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="success" disabled={busy === "all"} onClick={() => markAll("Present")}>
                                <CheckCheck /> All present
                            </Button>
                            <Button size="sm" variant="outline" disabled={busy === "all"} onClick={() => markAll("Absent")}>
                                All absent
                            </Button>
                        </div>
                    </div>
                )}

                {!batch ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Select a batch to start marking.</p>
                ) : loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-14" />
                        ))}
                    </div>
                ) : students.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">No students in this batch.</p>
                ) : (
                    <ul className="divide-y overflow-hidden rounded-xl border">
                        {students.map((s) => {
                            const st = marks[s.studentId];
                            return (
                                <li
                                    key={s.id}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 transition-colors",
                                        st === "Present" && "bg-success/6",
                                        st === "Absent" && "bg-destructive/5"
                                    )}
                                >
                                    <Avatar src={s.photoUrl} name={s.name} className="size-9" />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold">{s.name}</div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            Roll {s.roll} · <span className="font-mono">{s.studentId}</span>
                                        </div>
                                    </div>
                                    {busy === s.studentId && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                                    <div className="flex gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => mark(s, "Present")}
                                            aria-pressed={st === "Present"}
                                            aria-label={`Mark ${s.name} present`}
                                            className={cn(
                                                "flex h-10 w-12 items-center justify-center rounded-lg border text-sm font-extrabold transition-colors",
                                                st === "Present" ? "border-success bg-success text-white" : "bg-card hover:bg-success/10"
                                            )}
                                        >
                                            P
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => mark(s, "Absent")}
                                            aria-pressed={st === "Absent"}
                                            aria-label={`Mark ${s.name} absent`}
                                            className={cn(
                                                "flex h-10 w-12 items-center justify-center rounded-lg border text-sm font-extrabold transition-colors",
                                                st === "Absent" ? "border-destructive bg-destructive text-white" : "bg-card hover:bg-destructive/10"
                                            )}
                                        >
                                            A
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

function StatusList({ kind, batches, refreshKey }: { kind: AttendanceStatus; batches: string[]; refreshKey: number }) {
    const [date, setDate] = useState(todayYmd());
    const [batch, setBatch] = useState("");
    const [rows, setRows] = useState<AttendanceDTO[]>([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ date, status: kind });
            if (batch) params.set("batch", batch);
            const res = await fetch(`/api/attendance?${params}`);
            setRows(res.ok ? await res.json() : []);
        } catch {
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [date, batch, kind]);

    useEffect(() => {
        void load();
    }, [load, refreshKey]);

    async function toggle(r: AttendanceDTO) {
        const next: AttendanceStatus = kind === "Present" ? "Absent" : "Present";
        if (await putMark(date, r.studentId, next)) {
            setRows((prev) => prev.filter((x) => x.id !== r.id));
            toast.success(`${r.studentName} marked ${next.toLowerCase()}`);
        } else toast.error("Failed to update attendance");
    }

    const isPresent = kind === "Present";

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <span className={cn("size-2.5 rounded-full", isPresent ? "bg-success" : "bg-destructive")} />
                    {kind} List
                </CardTitle>
                <Badge variant={isPresent ? "success" : "destructive"}>{rows.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <SimpleSelect value={batch} onChange={setBatch} options={batches} allowNone noneLabel="All Batches" placeholder="All Batches" />
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value || todayYmd())} />
                </div>
                {loading ? (
                    <Skeleton className="h-24" />
                ) : rows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No records found</p>
                ) : (
                    <ul className="max-h-[420px] divide-y overflow-y-auto rounded-xl border">
                        {rows.map((r) => (
                            <li key={r.id} className="flex items-center gap-3 px-3 py-2">
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-semibold">{r.studentName}</div>
                                    <div className="truncate text-xs text-muted-foreground">
                                        <span className="font-mono">{r.studentId}</span> · {r.batch}
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant={isPresent ? "outline" : "success"}
                                    onClick={() => toggle(r)}
                                    title={isPresent ? "Mark absent" : "Mark present"}
                                >
                                    {isPresent ? <X /> : <Check />}
                                    {isPresent ? "Absent" : "Present"}
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

export function AttendanceBoard({ batches }: { batches: string[] }) {
    const [refreshKey, setRefreshKey] = useState(0);
    const bump = useCallback(() => setRefreshKey((k) => k + 1), []);
    return (
        <div className="space-y-5">
            <MarkSection batches={batches} onChanged={bump} />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <StatusList kind="Present" batches={batches} refreshKey={refreshKey} />
                <StatusList kind="Absent" batches={batches} refreshKey={refreshKey} />
            </div>
        </div>
    );
}
