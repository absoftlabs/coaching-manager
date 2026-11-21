"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, Avatar } from "@/components/ui/misc";
import { Field, FormActions, FormSection, SimpleSelect } from "@/components/shared/form";
import type { FeeDTO, StudentDTO } from "@/lib/types";
import { formatMoney, readError } from "@/lib/utils";

/** Collect a new fee (search student) or edit an existing fee record. */
export function FeeForm({ initial }: { initial?: FeeDTO }) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<StudentDTO[]>([]);
    const [searching, setSearching] = useState(false);
    const [student, setStudent] = useState<Pick<StudentDTO, "studentId" | "name" | "fatherName" | "motherName" | "batch" | "photoUrl" | "courseFee"> | null>(
        initial ? { studentId: initial.studentId, name: initial.studentName, fatherName: null, motherName: null, batch: "", photoUrl: null, courseFee: null } : null
    );
    const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
    const [depositBy, setDepositBy] = useState(initial?.depositBy ?? "");
    const [receivedBy, setReceivedBy] = useState(initial?.receivedBy ?? "");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const timer = useRef<number | null>(null);

    // Debounced student search
    useEffect(() => {
        if (timer.current) window.clearTimeout(timer.current);
        const q = query.trim();
        if (!q || student) {
            setResults([]);
            return;
        }
        timer.current = window.setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`/api/students?q=${encodeURIComponent(q)}&take=10`);
                setResults(res.ok ? await res.json() : []);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
    }, [query, student]);

    // On edit, load the student so the "deposit by" options include parents.
    useEffect(() => {
        if (!initial) return;
        fetch(`/api/students?q=${encodeURIComponent(initial.studentId)}&take=5`)
            .then((r) => (r.ok ? r.json() : []))
            .then((list: StudentDTO[]) => {
                const s = list.find((x) => x.studentId === initial.studentId);
                if (s) setStudent(s);
            })
            .catch(() => {});
    }, [initial]);

    const depositOptions = useMemo(() => {
        if (!student) return [];
        const opts = [`${student.name} (Student)`];
        if (student.fatherName) opts.push(`${student.fatherName} (Father)`);
        if (student.motherName) opts.push(`${student.motherName} (Mother)`);
        if (depositBy && !opts.includes(depositBy)) opts.push(depositBy);
        return opts;
    }, [student, depositBy]);

    function pick(s: StudentDTO) {
        setStudent(s);
        setQuery("");
        setResults([]);
        setDepositBy(`${s.name} (Student)`);
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (!student) return setError("Please select a student first.");
        if (!(Number(amount) > 0)) return setError("Enter a valid amount.");
        if (!depositBy.trim() || !receivedBy.trim()) return setError("All fields are required.");

        setSaving(true);
        const res = await fetch(initial ? `/api/fees/${initial.id}` : "/api/fees", {
            method: initial ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId: student.studentId, studentName: student.name, amount: Number(amount), depositBy, receivedBy }),
        });
        if (res.ok) {
            toast.success(initial ? "Fee updated" : "Fee collected");
            router.push("/fees-list");
            router.refresh();
        } else {
            setError(await readError(res, "Failed to save fee"));
            setSaving(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
            <Card>
                <CardContent className="space-y-8">
                    <FormSection title="Student">
                        <div className="relative sm:col-span-2">
                            {student ? (
                                <div className="flex items-center gap-3 rounded-xl border bg-accent/40 p-3">
                                    <Avatar src={student.photoUrl} name={student.name} className="size-11" />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-bold">{student.name}</div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            <span className="font-mono">{student.studentId}</span>
                                            {student.batch && ` · ${student.batch}`}
                                            {student.courseFee != null && ` · Course fee ${formatMoney(student.courseFee)}`}
                                        </div>
                                    </div>
                                    {!initial && (
                                        <Button type="button" size="icon-sm" variant="ghost" onClick={() => { setStudent(null); setDepositBy(""); }} aria-label="Change student">
                                            <X />
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <Field label="Search student by ID or name" htmlFor="q" required>
                                    <div className="relative">
                                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input id="q" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type student ID or name..." autoComplete="off" />
                                        {searching && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                                    </div>
                                </Field>
                            )}
                            {results.length > 0 && (
                                <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border bg-popover p-1 shadow-lg">
                                    {results.map((s) => (
                                        <li key={s.id}>
                                            <button type="button" onClick={() => pick(s)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-accent">
                                                <Avatar src={s.photoUrl} name={s.name} className="size-9" />
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold">{s.name}</div>
                                                    <div className="truncate text-xs text-muted-foreground">
                                                        {s.studentId} · {s.batch}
                                                        {s.fatherName ? ` · Father: ${s.fatherName}` : ""}
                                                    </div>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </FormSection>

                    <FormSection title="Payment">
                        <Field label="Amount (৳)" htmlFor="amount" required>
                            <Input id="amount" type="number" inputMode="decimal" min={1} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" required />
                        </Field>
                        <Field label="Deposit By" htmlFor="depositBy" required>
                            <SimpleSelect id="depositBy" value={depositBy} onChange={setDepositBy} options={depositOptions} placeholder={student ? "Select" : "Select a student first"} disabled={!student} />
                        </Field>
                        <Field label="Received By" htmlFor="receivedBy" required className="sm:col-span-2">
                            <Input id="receivedBy" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} placeholder="e.g. Accounts / Admin" required />
                        </Field>
                    </FormSection>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle />
                            {error}
                        </Alert>
                    )}

                    <FormActions>
                        <Link href="/fees-list" className={buttonVariants({ variant: "ghost" })}>
                            Cancel
                        </Link>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : initial ? "Update Fee" : "Save Fee"}
                        </Button>
                    </FormActions>
                </CardContent>
            </Card>
        </form>
    );
}
