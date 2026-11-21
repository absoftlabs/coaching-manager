"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { Field, SimpleSelect } from "@/components/shared/form";
import { useConfirm } from "@/components/shared/confirm";
import { SmsLogTable } from "@/components/sms/sms-log-table";
import { RESULT_TYPES, type ResultDTO, type SmsLogDTO, type SmsTemplateDTO, type StudentDTO } from "@/lib/types";
import { formatDate, readError } from "@/lib/utils";

export function StudentSms({
    batches,
    templates,
    smsReady,
}: {
    batches: string[];
    templates: SmsTemplateDTO[];
    smsReady: boolean;
}) {
    const confirm = useConfirm();
    const [batch, setBatch] = useState("");
    const [studentId, setStudentId] = useState("");
    const [templateId, setTemplateId] = useState("");
    const [resultType, setResultType] = useState("");
    const [resultId, setResultId] = useState("");
    const [students, setStudents] = useState<StudentDTO[]>([]);
    const [results, setResults] = useState<ResultDTO[]>([]);
    const [preview, setPreview] = useState("");
    const [sending, setSending] = useState(false);
    const [logs, setLogs] = useState<SmsLogDTO[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    useEffect(() => {
        setStudents([]);
        if (!batch) return;
        fetch(`/api/students?batch=${encodeURIComponent(batch)}&suspended=false`)
            .then((r) => (r.ok ? r.json() : []))
            .then(setStudents)
            .catch(() => setStudents([]));
    }, [batch]);

    useEffect(() => {
        setResults([]);
        if (!batch || !resultType) return;
        const p = new URLSearchParams({ batch, resultType, take: "30" });
        if (studentId) p.set("studentId", studentId);
        fetch(`/api/results?${p}`)
            .then((r) => (r.ok ? r.json() : []))
            .then(setResults)
            .catch(() => setResults([]));
    }, [batch, resultType, studentId]);

    // Live preview of the selected template for the selected result.
    useEffect(() => {
        const tpl = templates.find((t) => String(t.id) === templateId);
        const result = results.find((r) => String(r.id) === resultId);
        if (!tpl) return setPreview("");
        fetch("/api/sms/render", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ template: tpl.templateBody, studentId: studentId || result?.studentId, resultId: resultId || undefined }),
        })
            .then((r) => (r.ok ? r.json() : { preview: "" }))
            .then((j: { preview: string }) => setPreview(j.preview))
            .catch(() => setPreview(""));
    }, [templateId, resultId, studentId, templates, results]);

    const loadLogs = useCallback(async () => {
        setLoadingLogs(true);
        try {
            const p = new URLSearchParams({ audience: "student" });
            if (batch) p.set("batch", batch);
            const res = await fetch(`/api/sms/logs?${p}`);
            setLogs(res.ok ? await res.json() : []);
        } finally {
            setLoadingLogs(false);
        }
    }, [batch]);

    useEffect(() => {
        void loadLogs();
    }, [loadLogs]);

    async function send() {
        if (!batch || !templateId || !resultId) {
            toast.error("Select batch, template and result.");
            return;
        }
        const target = studentId ? students.find((s) => s.studentId === studentId)?.name ?? studentId : `all ${students.length} guardians in ${batch}`;
        const ok = await confirm({ title: "Send SMS?", description: `This will send the result SMS to ${target}.`, confirmText: "Send" });
        if (!ok) return;

        setSending(true);
        try {
            const res = await fetch("/api/sms/send/student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ batch, studentId: studentId || undefined, templateId, resultId }),
            });
            if (!res.ok) {
                toast.error(await readError(res, "Failed to send"));
                return;
            }
            const j = (await res.json()) as { sent: number; failed: number; count: number };
            if (j.failed === 0) toast.success(`Sent ${j.sent} SMS`);
            else toast.warning(`Sent ${j.sent} of ${j.count}. ${j.failed} failed or had no phone.`);
            await loadLogs();
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="space-y-5">
            {!smsReady && (
                <Alert variant="destructive">
                    <AlertTriangle />
                    <span>
                        SMS API is not configured. Add your API key and Sender ID in{" "}
                        <Link href="/settings" className="font-bold underline">
                            Settings
                        </Link>
                        .
                    </span>
                </Alert>
            )}
            <Card>
                <CardHeader>
                    <CardTitle>Send result SMS to guardians</CardTitle>
                    <CardDescription>Leave student empty to send to every guardian in the batch.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Field label="Batch" required>
                            <SimpleSelect
                                value={batch}
                                onChange={(v) => {
                                    setBatch(v);
                                    setStudentId("");
                                    setResultId("");
                                }}
                                options={batches}
                                placeholder="Select batch"
                            />
                        </Field>
                        <Field label="Student (optional)">
                            <SimpleSelect
                                value={studentId}
                                onChange={(v) => {
                                    setStudentId(v);
                                    setResultId("");
                                }}
                                options={students.map((s) => ({ value: s.studentId, label: `${s.name} (${s.studentId})` }))}
                                allowNone
                                noneLabel="All in batch"
                                placeholder="All in batch"
                                disabled={!batch}
                            />
                        </Field>
                        <Field label="SMS Template" required>
                            <SimpleSelect
                                value={templateId}
                                onChange={setTemplateId}
                                options={templates.map((t) => ({ value: String(t.id), label: t.templateName }))}
                                placeholder={templates.length ? "Select template" : "No templates yet"}
                            />
                        </Field>
                        <Field label="Result Type" required>
                            <SimpleSelect
                                value={resultType}
                                onChange={(v) => {
                                    setResultType(v);
                                    setResultId("");
                                }}
                                options={[...RESULT_TYPES]}
                                placeholder="Select type"
                            />
                        </Field>
                        <Field label="Result" required className="sm:col-span-2" hint="Recent results filtered by batch / student / type.">
                            <SimpleSelect
                                value={resultId}
                                onChange={setResultId}
                                options={results.map((r) => ({
                                    value: String(r.id),
                                    label: `${r.studentName} — ${r.resultType} — ${formatDate(r.examDate)}`,
                                }))}
                                placeholder={!batch || !resultType ? "Select batch & type first" : results.length ? "Select result" : "No results found"}
                                disabled={!results.length}
                            />
                        </Field>
                    </div>

                    {preview && (
                        <div className="rounded-xl border border-dashed bg-accent/30 p-3">
                            <div className="mb-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">Message preview</div>
                            <p className="text-sm whitespace-pre-wrap">{preview}</p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button onClick={send} disabled={sending || !smsReady} className="w-full sm:w-auto">
                            <Send /> {sending ? "Sending..." : "Send SMS"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <SmsLogTable title="SMS Log (Students)" logs={logs} loading={loadingLogs} onRefresh={loadLogs} audience="student" />
        </div>
    );
}
