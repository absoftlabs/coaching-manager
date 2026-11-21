"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/misc";
import { Field, SimpleSelect } from "@/components/shared/form";
import { useConfirm } from "@/components/shared/confirm";
import { SmsLogTable } from "@/components/sms/sms-log-table";
import type { SmsLogDTO, TeacherDTO } from "@/lib/types";
import { readError } from "@/lib/utils";

export function TeacherSms({ teachers, smsReady }: { teachers: TeacherDTO[]; smsReady: boolean }) {
    const confirm = useConfirm();
    const [scope, setScope] = useState<"ALL" | "INDIVIDUAL">("ALL");
    const [teacherId, setTeacherId] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [logs, setLogs] = useState<SmsLogDTO[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const loadLogs = useCallback(async () => {
        setLoadingLogs(true);
        try {
            const res = await fetch("/api/sms/logs?audience=teacher");
            setLogs(res.ok ? await res.json() : []);
        } finally {
            setLoadingLogs(false);
        }
    }, []);

    useEffect(() => {
        void loadLogs();
    }, [loadLogs]);

    async function send() {
        if (!message.trim()) return toast.error("Write a message first.");
        if (scope === "INDIVIDUAL" && !teacherId) return toast.error("Select a teacher.");
        const target = scope === "ALL" ? `all ${teachers.length} active teachers` : teachers.find((t) => String(t.id) === teacherId)?.name;
        if (!(await confirm({ title: "Send SMS?", description: `This message will be sent to ${target}.`, confirmText: "Send" }))) return;

        setSending(true);
        try {
            const res = await fetch("/api/sms/send/teacher", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scope, teacherId: scope === "INDIVIDUAL" ? teacherId : undefined, message }),
            });
            if (!res.ok) {
                toast.error(await readError(res, "Failed to send"));
                return;
            }
            const j = (await res.json()) as { sent: number; failed: number; count: number };
            if (j.failed === 0) toast.success(`Sent ${j.sent} SMS`);
            else toast.warning(`Sent ${j.sent} of ${j.count}. ${j.failed} failed or had no phone.`);
            setMessage("");
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
                    <CardTitle>Send SMS to teachers</CardTitle>
                    <CardDescription>Suspended teachers are skipped.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Send to" required>
                            <SimpleSelect
                                value={scope}
                                onChange={(v) => {
                                    setScope(v as "ALL" | "INDIVIDUAL");
                                    if (v === "ALL") setTeacherId("");
                                }}
                                options={[
                                    { value: "ALL", label: "All teachers" },
                                    { value: "INDIVIDUAL", label: "Individual teacher" },
                                ]}
                            />
                        </Field>
                        <Field label="Teacher">
                            <SimpleSelect
                                value={teacherId}
                                onChange={setTeacherId}
                                options={teachers.map((t) => ({
                                    value: String(t.id),
                                    label: `${t.name}${t.primarySubject ? ` – ${t.primarySubject}` : ""}`,
                                }))}
                                placeholder="Select teacher"
                                disabled={scope !== "INDIVIDUAL"}
                            />
                        </Field>
                        <Field label="Message" htmlFor="msg" required className="sm:col-span-2" hint={`${message.length} characters`}>
                            <Textarea id="msg" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message..." />
                        </Field>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={send} disabled={sending || !smsReady} className="w-full sm:w-auto">
                            <Send /> {sending ? "Sending..." : "Send SMS"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <SmsLogTable title="SMS Log (Teachers)" logs={logs} loading={loadingLogs} onRefresh={loadLogs} audience="teacher" />
        </div>
    );
}
