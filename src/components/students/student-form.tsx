"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/misc";
import { Field, FormActions, FormSection, ImagePicker, SimpleSelect } from "@/components/shared/form";
import { DIVISIONS, GENDERS, SECTIONS, type StudentDTO } from "@/lib/types";
import { readError } from "@/lib/utils";

type GuardianMode = "Father" | "Mother" | "Custom";

export function StudentForm({ batches, initial }: { batches: string[]; initial?: StudentDTO }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: initial?.name ?? "",
        batch: initial?.batch ?? "",
        roll: initial?.roll ?? "",
        division: initial?.division ?? "",
        birthDate: initial?.birthDate ?? "",
        schoolName: initial?.schoolName ?? "",
        schoolRoll: initial?.schoolRoll ?? "",
        schoolSection: initial?.schoolSection ?? "",
        address: initial?.address ?? "",
        fatherName: initial?.fatherName ?? "",
        motherName: initial?.motherName ?? "",
        guardianPhone: initial?.guardianPhone ?? "",
        gender: initial?.gender ?? "",
        courseFee: initial?.courseFee != null ? String(initial.courseFee) : "",
        photoUrl: initial?.photoUrl ?? "",
    });
    const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

    const [guardianMode, setGuardianMode] = useState<GuardianMode>(() => {
        if (!initial) return "Father";
        if (initial.guardianName && initial.guardianName === initial.fatherName) return "Father";
        if (initial.guardianName && initial.guardianName === initial.motherName) return "Mother";
        return initial.guardianName ? "Custom" : "Father";
    });
    const [customGuardian, setCustomGuardian] = useState(guardianMode === "Custom" ? initial?.guardianName ?? "" : "");

    const guardianName = useMemo(() => {
        if (guardianMode === "Father") return form.fatherName.trim();
        if (guardianMode === "Mother") return form.motherName.trim();
        return customGuardian.trim();
    }, [guardianMode, form.fatherName, form.motherName, customGuardian]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (!form.name.trim() || !form.batch || !form.roll.trim()) {
            setError("Name, batch and roll are required.");
            return;
        }
        setSaving(true);
        const payload = { ...form, guardianName, courseFee: form.courseFee === "" ? null : Number(form.courseFee) };
        const res = await fetch(initial ? `/api/students/${initial.id}` : "/api/students", {
            method: initial ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            toast.success(initial ? "Student updated" : "Student added");
            router.push(initial?.isSuspended ? "/suspended-students" : "/student-list");
            router.refresh();
        } else {
            setError(await readError(res, initial ? "Failed to update" : "Failed to add"));
            setSaving(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="mx-auto max-w-4xl">
            <Card>
                <CardContent className="space-y-8">
                    {initial && (
                        <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                            Student ID: <span className="font-mono font-bold">{initial.studentId}</span>
                        </div>
                    )}

                    <FormSection title="Basic info">
                        <div className="sm:col-span-2">
                            <ImagePicker label="Student photo" value={form.photoUrl} onChange={(v) => set("photoUrl", v)} />
                        </div>
                        <Field label="Name" htmlFor="name" required>
                            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Student name" required />
                        </Field>
                        <Field label="Batch" htmlFor="batch" required hint={batches.length ? undefined : "No batches yet — create one in Batches first."}>
                            <SimpleSelect id="batch" value={form.batch} onChange={(v) => set("batch", v)} options={batches} placeholder="Select batch" />
                        </Field>
                        <Field label="Roll" htmlFor="roll" required>
                            <Input id="roll" value={form.roll} onChange={(e) => set("roll", e.target.value)} placeholder="e.g. 101" inputMode="numeric" required />
                        </Field>
                        <Field label="Group" htmlFor="division">
                            <SimpleSelect id="division" value={form.division} onChange={(v) => set("division", v)} options={[...DIVISIONS]} allowNone placeholder="None" />
                        </Field>
                        <Field label="Gender" htmlFor="gender">
                            <SimpleSelect id="gender" value={form.gender} onChange={(v) => set("gender", v)} options={[...GENDERS]} allowNone placeholder="Select" />
                        </Field>
                        <Field label="Birth Date" htmlFor="birthDate">
                            <Input id="birthDate" type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
                        </Field>
                        <Field label="Course Fee (৳)" htmlFor="courseFee">
                            <Input id="courseFee" type="number" inputMode="decimal" min={0} value={form.courseFee} onChange={(e) => set("courseFee", e.target.value)} placeholder="Course fee" />
                        </Field>
                    </FormSection>

                    <FormSection title="School">
                        <Field label="School Name" htmlFor="schoolName" className="sm:col-span-2">
                            <Input id="schoolName" value={form.schoolName} onChange={(e) => set("schoolName", e.target.value)} placeholder="e.g. City High School" />
                        </Field>
                        <Field label="School Roll" htmlFor="schoolRoll">
                            <Input id="schoolRoll" value={form.schoolRoll} onChange={(e) => set("schoolRoll", e.target.value)} placeholder="e.g. 5501" />
                        </Field>
                        <Field label="School Section" htmlFor="schoolSection">
                            <SimpleSelect id="schoolSection" value={form.schoolSection} onChange={(v) => set("schoolSection", v)} options={[...SECTIONS]} allowNone placeholder="None" />
                        </Field>
                        <Field label="Address" htmlFor="address" className="sm:col-span-2">
                            <Textarea id="address" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="House, Road, Area, City" />
                        </Field>
                    </FormSection>

                    <FormSection title="Family & guardian" description="Result SMS are sent to the guardian phone.">
                        <Field label="Father's Name" htmlFor="fatherName">
                            <Input id="fatherName" value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)} />
                        </Field>
                        <Field label="Mother's Name" htmlFor="motherName">
                            <Input id="motherName" value={form.motherName} onChange={(e) => set("motherName", e.target.value)} />
                        </Field>
                        <Field label="Guardian" htmlFor="guardianMode">
                            <SimpleSelect
                                id="guardianMode"
                                value={guardianMode}
                                onChange={(v) => setGuardianMode(v as GuardianMode)}
                                options={[
                                    { value: "Father", label: `Father${form.fatherName ? ` (${form.fatherName})` : ""}` },
                                    { value: "Mother", label: `Mother${form.motherName ? ` (${form.motherName})` : ""}` },
                                    { value: "Custom", label: "Custom" },
                                ]}
                            />
                        </Field>
                        <Field label="Guardian Phone" htmlFor="guardianPhone">
                            <Input id="guardianPhone" type="tel" inputMode="tel" value={form.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} placeholder="01XXXXXXXXX" />
                        </Field>
                        {guardianMode === "Custom" && (
                            <Field label="Custom Guardian Name" htmlFor="customGuardian">
                                <Input id="customGuardian" value={customGuardian} onChange={(e) => setCustomGuardian(e.target.value)} placeholder="Guardian name" />
                            </Field>
                        )}
                        <Field label="Guardian Name (auto-filled)" htmlFor="guardianPreview" className={guardianMode === "Custom" ? "" : "sm:col-span-2"}>
                            <Input id="guardianPreview" value={guardianName} readOnly />
                        </Field>
                    </FormSection>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle />
                            {error}
                        </Alert>
                    )}

                    <FormActions>
                        <Link href="/student-list" className={buttonVariants({ variant: "ghost" })}>
                            Cancel
                        </Link>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : initial ? "Update Student" : "Save Student"}
                        </Button>
                    </FormActions>
                </CardContent>
            </Card>
        </form>
    );
}
