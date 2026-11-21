"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { Field, FormActions, FormSection, ImagePicker } from "@/components/shared/form";
import { CredentialsDialog } from "@/components/shared/credentials-dialog";
import type { Credentials, TeacherDTO } from "@/lib/types";
import { readError } from "@/lib/utils";

export function TeacherForm({ initial }: { initial?: TeacherDTO }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [credentials, setCredentials] = useState<Credentials | null>(null);
    const [form, setForm] = useState({
        name: initial?.name ?? "",
        phone: initial?.phone ?? "",
        primarySubject: initial?.primarySubject ?? "",
        joinDate: initial?.joinDate ?? "",
        salary: initial?.salary != null ? String(initial.salary) : "",
        imageUrl: initial?.imageUrl ?? "",
    });
    const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (!form.name.trim() || !form.phone.trim() || !form.primarySubject.trim()) {
            setError("Name, phone and primary subject are required.");
            return;
        }
        setSaving(true);
        const res = await fetch(initial ? `/api/teachers/${initial.id}` : "/api/teachers", {
            method: initial ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, salary: form.salary === "" ? null : Number(form.salary) }),
        });
        if (!res.ok) {
            setError(await readError(res, "Failed to save"));
            setSaving(false);
            return;
        }
        if (initial) {
            toast.success("Teacher updated");
            router.push(initial.isSuspended ? "/suspended-teacher" : "/teacher-list");
            router.refresh();
            return;
        }
        const j = (await res.json()) as { credentials?: Credentials };
        toast.success("Teacher added");
        if (j.credentials) setCredentials(j.credentials);
        else router.push("/teacher-list");
    }

    return (
        <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
            <Card>
                <CardContent className="space-y-8">
                    <FormSection
                        title="Teacher details"
                        description={initial ? undefined : "A login is created automatically — username is the phone number."}
                    >
                        <div className="sm:col-span-2">
                            <ImagePicker label="Teacher photo" value={form.imageUrl} onChange={(v) => set("imageUrl", v)} />
                        </div>
                        <Field label="Teacher Name" htmlFor="name" required>
                            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Mr. Rahman" required />
                        </Field>
                        <Field label="Phone" htmlFor="phone" required>
                            <Input id="phone" type="tel" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01XXXXXXXXX" required />
                        </Field>
                        <Field label="Primary Subject" htmlFor="primarySubject" required>
                            <Input id="primarySubject" value={form.primarySubject} onChange={(e) => set("primarySubject", e.target.value)} placeholder="e.g. Physics" required />
                        </Field>
                        <Field label="Join Date" htmlFor="joinDate">
                            <Input id="joinDate" type="date" value={form.joinDate} onChange={(e) => set("joinDate", e.target.value)} />
                        </Field>
                        <Field label="Salary (৳)" htmlFor="salary">
                            <Input id="salary" type="number" inputMode="decimal" min={0} value={form.salary} onChange={(e) => set("salary", e.target.value)} placeholder="e.g. 25000" />
                        </Field>
                    </FormSection>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle />
                            {error}
                        </Alert>
                    )}

                    <FormActions>
                        <Link href="/teacher-list" className={buttonVariants({ variant: "ghost" })}>
                            Cancel
                        </Link>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : initial ? "Update Teacher" : "Save Teacher"}
                        </Button>
                    </FormActions>
                </CardContent>
            </Card>

            <CredentialsDialog
                credentials={credentials}
                title="Teacher login created"
                description="Share these credentials with the teacher. Ask them to change the password from Change Password after logging in."
                onClose={() => {
                    setCredentials(null);
                    router.push("/teacher-list");
                    router.refresh();
                }}
            />
        </form>
    );
}
