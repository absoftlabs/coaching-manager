"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/misc";
import { Field, FormActions, FormSection, SimpleSelect } from "@/components/shared/form";
import { RESULT_TYPES, type ClassDTO, type ResultDTO, type StudentDTO } from "@/lib/types";
import { gpaLabel } from "@/lib/grade";
import { readError } from "@/lib/utils";

type Row = { className: string; mcqTotal: string; mcqGain: string; quesTotal: string; quesGain: string };
const emptyRow = (className = ""): Row => ({ className, mcqTotal: "", mcqGain: "", quesTotal: "", quesGain: "" });
const num = (v: string) => Number(v) || 0;

export function ResultForm({
    batches,
    classes,
    initial,
}: {
    batches: string[];
    classes: ClassDTO[];
    initial?: ResultDTO;
}) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [batch, setBatch] = useState(initial?.batch ?? "");
    const [studentId, setStudentId] = useState(initial?.studentId ?? "");
    const [students, setStudents] = useState<StudentDTO[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [resultType, setResultType] = useState<string>(initial?.resultType ?? "");
    const [examDate, setExamDate] = useState(initial?.examDate?.slice(0, 10) ?? "");
    const [rows, setRows] = useState<Row[]>(
        initial?.subjects.length
            ? initial.subjects.map((s) => ({
                  className: s.className,
                  mcqTotal: String(s.mcqTotal),
                  mcqGain: String(s.mcqGain),
                  quesTotal: String(s.quesTotal),
                  quesGain: String(s.quesGain),
              }))
            : [emptyRow()]
    );

    // Classes of the selected batch; falls back to all classes if the batch has none.
    const subjectOptions = useMemo(() => {
        if (!batch) return [];
        const inBatch = classes.filter((c) => c.batch === batch).map((c) => c.name);
        const list = inBatch.length ? inBatch : classes.map((c) => c.name);
        const extra = rows.map((r) => r.className).filter(Boolean);
        return Array.from(new Set([...list, ...extra]));
    }, [batch, classes, rows]);

    useEffect(() => {
        if (!batch) {
            setStudents([]);
            return;
        }
        let cancelled = false;
        setLoadingStudents(true);
        fetch(`/api/students?batch=${encodeURIComponent(batch)}&suspended=false`)
            .then((r) => (r.ok ? r.json() : []))
            .then((list: StudentDTO[]) => !cancelled && setStudents(list))
            .catch(() => !cancelled && setStudents([]))
            .finally(() => !cancelled && setLoadingStudents(false));
        return () => {
            cancelled = true;
        };
    }, [batch]);

    function onBatchChange(v: string) {
        setBatch(v);
        setStudentId("");
        const inBatch = classes.filter((c) => c.batch === v);
        setRows([emptyRow(inBatch.length === 1 ? inBatch[0].name : "")]);
    }

    function update(i: number, key: keyof Row, value: string) {
        setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
    }

    const totals = rows.reduce(
        (a, r) => ({ total: a.total + num(r.mcqTotal) + num(r.quesTotal), gain: a.gain + num(r.mcqGain) + num(r.quesGain) }),
        { total: 0, gain: 0 }
    );

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        const student = students.find((s) => s.studentId === studentId);
        if (!batch) return setError("Select a batch.");
        if (!studentId) return setError("Select a student.");
        if (!resultType) return setError("Select a result type.");
        if (rows.some((r) => !r.className)) return setError("Choose a subject for every row.");
        const over = rows.find((r) => num(r.mcqGain) > num(r.mcqTotal) || num(r.quesGain) > num(r.quesTotal));
        if (over) return setError(`Gained marks can't exceed total marks (${over.className}).`);

        setSaving(true);
        const res = await fetch(initial ? `/api/results/${initial.id}` : "/api/results", {
            method: initial ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                batch,
                studentId,
                studentName: student?.name ?? initial?.studentName ?? "",
                resultType,
                examDate: examDate || null,
                subjects: rows.map((r) => ({
                    className: r.className,
                    mcqTotal: num(r.mcqTotal),
                    mcqGain: num(r.mcqGain),
                    quesTotal: num(r.quesTotal),
                    quesGain: num(r.quesGain),
                })),
            }),
        });
        if (res.ok) {
            toast.success(initial ? "Result updated" : "Result saved");
            router.push("/result-list");
            router.refresh();
        } else {
            setError(await readError(res, "Failed to save"));
            setSaving(false);
        }
    }

    const studentOptions = students.map((s) => ({ value: s.studentId, label: `${s.name} (Roll ${s.roll}) — ${s.studentId}` }));
    if (initial && studentId && !students.some((s) => s.studentId === studentId)) {
        studentOptions.unshift({ value: studentId, label: `${initial.studentName} — ${studentId}` });
    }

    return (
        <form onSubmit={onSubmit} className="mx-auto max-w-5xl">
            <Card>
                <CardContent className="space-y-8">
                    <FormSection title="Exam">
                        <Field label="Batch" htmlFor="batch" required>
                            <SimpleSelect id="batch" value={batch} onChange={onBatchChange} options={batches} placeholder="Select batch" />
                        </Field>
                        <Field label="Student" htmlFor="student" required>
                            <SimpleSelect
                                id="student"
                                value={studentId}
                                onChange={setStudentId}
                                options={studentOptions}
                                placeholder={!batch ? "Select batch first" : loadingStudents ? "Loading..." : "Select student"}
                                disabled={!batch}
                            />
                        </Field>
                        <Field label="Result Type" htmlFor="resultType" required>
                            <SimpleSelect id="resultType" value={resultType} onChange={setResultType} options={[...RESULT_TYPES]} placeholder="Select type" />
                        </Field>
                        <Field label="Exam Date" htmlFor="examDate" hint="Defaults to today if left empty.">
                            <Input id="examDate" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                        </Field>
                    </FormSection>

                    <section className="space-y-4">
                        <div className="flex items-end justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-extrabold tracking-wide text-primary uppercase">Subjects</h2>
                                <p className="text-xs text-muted-foreground">MCQ + written marks per subject.</p>
                            </div>
                            <div className="text-right text-sm">
                                <div className="font-extrabold tabular-nums">
                                    {totals.gain}/{totals.total}
                                </div>
                                <div className="text-xs text-muted-foreground">{gpaLabel(totals.gain, totals.total)}</div>
                            </div>
                        </div>

                        {rows.map((r, i) => (
                            <div key={i} className="space-y-3 rounded-xl border bg-muted/30 p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">Subject #{i + 1}</span>
                                    {rows.length > 1 && (
                                        <Button type="button" size="icon-sm" variant="ghost" className="text-destructive" onClick={() => setRows((p) => p.filter((_, idx) => idx !== i))} aria-label="Remove subject">
                                            <Trash2 />
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                                    <div className="col-span-2 space-y-2 md:col-span-1">
                                        <Label>Class / Subject</Label>
                                        <SimpleSelect
                                            value={r.className}
                                            onChange={(v) => update(i, "className", v)}
                                            options={subjectOptions}
                                            placeholder={batch ? "Select" : "Select batch first"}
                                            disabled={!batch}
                                        />
                                    </div>
                                    {(
                                        [
                                            ["mcqTotal", "MCQ Total"],
                                            ["mcqGain", "MCQ Gain"],
                                            ["quesTotal", "Written Total"],
                                            ["quesGain", "Written Gain"],
                                        ] as const
                                    ).map(([key, label]) => (
                                        <div key={key} className="space-y-2">
                                            <Label>{label}</Label>
                                            <Input type="number" inputMode="decimal" min={0} step="any" value={r[key]} onChange={(e) => update(i, key, e.target.value)} placeholder="0" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => setRows((p) => [...p, emptyRow()])} disabled={!batch}>
                            <Plus /> Add another subject
                        </Button>
                    </section>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle />
                            {error}
                        </Alert>
                    )}

                    <FormActions>
                        <Link href="/result-list" className={buttonVariants({ variant: "ghost" })}>
                            Cancel
                        </Link>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : initial ? "Update Result" : "Save Result"}
                        </Button>
                    </FormActions>
                </CardContent>
            </Card>
        </form>
    );
}
