"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert } from "@/components/ui/misc";
import { Field, FormActions, FormSection, SimpleSelect } from "@/components/shared/form";
import { DAYS, type ClassDTO } from "@/lib/types";
import { cn, readError } from "@/lib/utils";

export function ClassForm({
    batches,
    teachers,
    initial,
}: {
    batches: string[];
    teachers: string[];
    initial?: ClassDTO;
}) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [name, setName] = useState(initial?.name ?? "");
    const [code, setCode] = useState(initial?.code ?? "");
    const [teacher, setTeacher] = useState(initial?.teacher ?? "");
    const [batch, setBatch] = useState(initial?.batch ?? "");
    const [days, setDays] = useState<Set<string>>(new Set(initial?.days ?? []));
    const [isActive, setIsActive] = useState(initial?.isActive ?? true);

    // Keep a teacher who has since been suspended selectable on edit.
    const teacherOptions = Array.from(new Set(teacher ? [teacher, ...teachers] : teachers));

    function toggleDay(d: string) {
        setDays((prev) => {
            const next = new Set(prev);
            if (next.has(d)) next.delete(d);
            else next.add(d);
            return next;
        });
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (!name.trim() || !code.trim() || !teacher || !batch) {
            setError("Name, code, teacher and batch are required.");
            return;
        }
        setSaving(true);
        const res = await fetch(initial ? `/api/classes/${initial.id}` : "/api/classes", {
            method: initial ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, code, teacher, batch, days: DAYS.filter((d) => days.has(d)), isActive }),
        });
        if (res.ok) {
            toast.success(initial ? "Class updated" : "Class created");
            router.push("/class-list");
            router.refresh();
        } else {
            setError(await readError(res, "Failed to save"));
            setSaving(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
            <Card>
                <CardContent className="space-y-8">
                    <FormSection title="Class details">
                        <Field label="Class Name" htmlFor="name" required>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Physics HSC 2026" required />
                        </Field>
                        <Field label="Class Code" htmlFor="code" required>
                            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. PHY-26-A" required />
                        </Field>
                        <Field label="Teacher" htmlFor="teacher" required hint={teacherOptions.length ? undefined : "No active teachers — add one first."}>
                            <SimpleSelect id="teacher" value={teacher} onChange={setTeacher} options={teacherOptions} placeholder="Select teacher" />
                        </Field>
                        <Field label="Batch" htmlFor="batch" required hint={batches.length ? undefined : "No batches — create one first."}>
                            <SimpleSelect id="batch" value={batch} onChange={setBatch} options={batches} placeholder="Select batch" />
                        </Field>
                    </FormSection>

                    <section className="space-y-3">
                        <Label>Class days</Label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS.map((d) => {
                                const on = days.has(d);
                                return (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => toggleDay(d)}
                                        aria-pressed={on}
                                        className={cn(
                                            "h-10 min-w-14 rounded-lg border px-3 text-sm font-bold transition-colors",
                                            on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
                                        )}
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <label className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
                        <div>
                            <div className="text-sm font-semibold">Active</div>
                            <div className="text-xs text-muted-foreground">Inactive classes stay in the list but are marked inactive.</div>
                        </div>
                        <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </label>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle />
                            {error}
                        </Alert>
                    )}

                    <FormActions>
                        <Link href="/class-list" className={buttonVariants({ variant: "ghost" })}>
                            Cancel
                        </Link>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : initial ? "Update Class" : "Save Class"}
                        </Button>
                    </FormActions>
                </CardContent>
            </Card>
        </form>
    );
}
