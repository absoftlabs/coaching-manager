"use client";

import { useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/form";
import { useConfirm } from "@/components/shared/confirm";
import { SMS_PLACEHOLDERS, renderTemplate } from "@/lib/sms/render";
import type { SmsTemplateDTO } from "@/lib/types";
import { formatDateTime, readError } from "@/lib/utils";

const SAMPLE = {
    coachingName: "",
    student: { name: "Arif Hasan", studentId: "PCC-01930", roll: "42" },
    result: {
        resultType: "Weekly Test",
        examDate: "2025-10-27",
        subjects: [
            { className: "Physics", totalMarks: 100, totalGain: 50 },
            { className: "Chemistry", totalMarks: 100, totalGain: 70 },
        ],
    },
};

export function TemplatesManager({ initial, orgName }: { initial: SmsTemplateDTO[]; orgName: string }) {
    const confirm = useConfirm();
    const [rows, setRows] = useState(initial);
    const [editing, setEditing] = useState<SmsTemplateDTO | null>(null);
    const [name, setName] = useState("");
    const [body, setBody] = useState("");
    const [saving, setSaving] = useState(false);
    const bodyRef = useRef<HTMLTextAreaElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    function reset() {
        setEditing(null);
        setName("");
        setBody("");
    }

    function edit(t: SmsTemplateDTO) {
        setEditing(t);
        setName(t.templateName);
        setBody(t.templateBody);
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    /** Inserts a placeholder at the cursor position. */
    function insert(key: string) {
        const el = bodyRef.current;
        if (!el) return setBody((b) => b + key);
        const start = el.selectionStart ?? body.length;
        const end = el.selectionEnd ?? body.length;
        const next = body.slice(0, start) + key + body.slice(end);
        setBody(next);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + key.length, start + key.length);
        });
    }

    async function save(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !body.trim()) return;
        setSaving(true);
        const res = await fetch(editing ? `/api/sms/templates/${editing.id}` : "/api/sms/templates", {
            method: editing ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateName: name, templateBody: body }),
        });
        setSaving(false);
        if (!res.ok) {
            toast.error(await readError(res, "Failed to save template"));
            return;
        }
        const saved = (await res.json()) as SmsTemplateDTO;
        setRows((prev) => [saved, ...prev.filter((x) => x.id !== saved.id)]);
        toast.success(editing ? "Template updated" : "Template saved");
        reset();
    }

    async function remove(t: SmsTemplateDTO) {
        const ok = await confirm({ title: `Delete "${t.templateName}"?`, description: "This cannot be undone.", confirmText: "Delete", destructive: true });
        if (!ok) return;
        const res = await fetch(`/api/sms/templates/${t.id}`, { method: "DELETE" });
        if (res.ok) {
            setRows((prev) => prev.filter((x) => x.id !== t.id));
            if (editing?.id === t.id) reset();
            toast.success("Template deleted");
        } else toast.error("Delete failed");
    }

    const preview = body.trim() ? renderTemplate(body, { ...SAMPLE, coachingName: orgName }) : "";

    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr]">
            <div ref={formRef} className="scroll-mt-20">
                <Card>
                    <CardHeader>
                        <CardTitle>{editing ? "Edit Template" : "Create Template"}</CardTitle>
                        <CardDescription>Tap a variable to insert it into the message.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={save} className="space-y-4">
                            <Field label="Template Name" htmlFor="tname" required>
                                <Input id="tname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Result Notice - Weekly" required />
                            </Field>
                            <Field label="Message" htmlFor="tbody" required hint={`${body.length} characters`}>
                                <Textarea
                                    id="tbody"
                                    ref={bodyRef}
                                    className="min-h-36"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Dear guardian, [student-name] got [gain-mark/total-mark] in [exam-type] on [exam-date]. – [coaching-name]"
                                    required
                                />
                            </Field>
                            <div className="flex flex-wrap gap-1.5">
                                {SMS_PLACEHOLDERS.map((p) => (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => insert(p.key)}
                                        title={`${p.label} — e.g. ${p.example}`}
                                        className="rounded-md border bg-muted/50 px-2 py-1 font-mono text-[11px] font-semibold hover:border-primary hover:bg-accent"
                                    >
                                        {p.key}
                                    </button>
                                ))}
                            </div>
                            {preview && (
                                <div className="rounded-xl border border-dashed bg-accent/30 p-3">
                                    <div className="mb-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">Preview (sample data)</div>
                                    <p className="text-sm whitespace-pre-wrap">{preview}</p>
                                </div>
                            )}
                            <div className="flex justify-end gap-2">
                                {editing && (
                                    <Button type="button" variant="ghost" onClick={reset}>
                                        Cancel
                                    </Button>
                                )}
                                <Button type="submit" disabled={saving}>
                                    {saving ? "Saving..." : editing ? "Update Template" : "Save Template"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>SMS Templates</CardTitle>
                    <CardDescription>{rows.length} saved</CardDescription>
                </CardHeader>
                <CardContent>
                    {rows.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">No templates yet</p>
                    ) : (
                        <ul className="space-y-2.5">
                            {rows.map((t) => (
                                <li key={t.id} className="rounded-xl border p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="truncate font-bold">{t.templateName}</div>
                                            <div className="text-[11px] text-muted-foreground">Updated {formatDateTime(t.updatedAt)}</div>
                                        </div>
                                        <div className="flex shrink-0 gap-1">
                                            <Button size="icon-sm" variant="ghost" onClick={() => edit(t)} aria-label="Edit">
                                                <Pencil />
                                            </Button>
                                            <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => remove(t)} aria-label="Delete">
                                                <Trash2 />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{t.templateBody}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
