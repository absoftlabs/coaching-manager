"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, MessageSquare, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/shared/data-table";
import { useConfirm } from "@/components/shared/confirm";
import { SimpleSelect } from "@/components/shared/form";
import { DetailRow } from "@/components/shared/misc";
import { useApp, useOrgLogo } from "@/components/providers";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { printMarkSheet } from "@/lib/print";
import { getGpa, gpaLabel, percentOf } from "@/lib/grade";
import type { ResultDTO, SmsTemplateDTO } from "@/lib/types";
import { formatDate, readError } from "@/lib/utils";

export function ResultList({
    rows,
    batches,
    classes,
    templates,
}: {
    rows: ResultDTO[];
    batches: string[];
    classes: string[];
    templates: SmsTemplateDTO[];
}) {
    const { org } = useApp();
    const logo = useOrgLogo();
    const confirm = useConfirm();
    const [data, setData] = useState(rows);
    const [batch, setBatch] = useState("");
    const [className, setClassName] = useState("");
    const [templateId, setTemplateId] = useState(templates[0] ? String(templates[0].id) : "");
    const [sendingId, setSendingId] = useState<number | null>(null);
    const [view, setView] = useState<ResultDTO | null>(null);

    const scoped = data
        .filter((r) => !batch || r.batch === batch)
        .filter((r) => !className || r.subjects.some((s) => s.className === className));

    async function onDelete(r: ResultDTO) {
        const ok = await confirm({ title: "Delete this result?", description: `${r.studentName} — ${r.resultType}`, confirmText: "Delete", destructive: true });
        if (!ok) return;
        const res = await fetch(`/api/results/${r.id}`, { method: "DELETE" });
        if (res.ok) {
            setData((prev) => prev.filter((x) => x.id !== r.id));
            toast.success("Result deleted");
        } else toast.error("Delete failed");
    }

    async function sendSms(r: ResultDTO) {
        if (!templateId) {
            toast.error("Select an SMS template first.");
            return;
        }
        setSendingId(r.id);
        try {
            const res = await fetch("/api/sms/send/student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ batch: r.batch, studentId: r.studentId, templateId, resultId: r.id }),
            });
            if (!res.ok) {
                toast.error(await readError(res, "SMS failed"));
                return;
            }
            const j = (await res.json()) as { items: Array<{ status: string; error?: string }> };
            const item = j.items[0];
            if (item?.status === "sent") toast.success(`SMS sent to ${r.studentName}'s guardian`);
            else if (item?.status === "skip-no-phone") toast.error("Guardian phone number is missing");
            else toast.error(item?.error || "SMS failed");
        } finally {
            setSendingId(null);
        }
    }

    function print(r: ResultDTO) {
        printMarkSheet(r, { ...org, logo });
    }

    const columns: Column<ResultDTO>[] = [
        { key: "student", header: "Student", hideOnMobile: true, cell: (r) => <span className="font-semibold">{r.studentName}</span> },
        { key: "id", header: "Student ID", hideOnMobile: true, cell: (r) => <span className="font-mono text-xs">{r.studentId}</span> },
        { key: "batch", header: "Batch", cell: (r) => r.batch },
        { key: "type", header: "Type", cell: (r) => r.resultType },
        { key: "date", header: "Date", cell: (r) => formatDate(r.examDate) },
        {
            key: "subjects",
            header: "Subjects (G/T)",
            className: "wide max-w-[300px] whitespace-normal",
            cell: (r) => r.subjects.map((s) => `${s.className} ${s.totalGain}/${s.totalMarks}`).join(", "),
        },
        {
            key: "gpa",
            header: "GPA",
            cell: (r) => {
                const g = getGpa(percentOf(r.totalGain, r.totalMarks));
                return <Badge variant={g.grade === "F" ? "destructive" : "success"}>{gpaLabel(r.totalGain, r.totalMarks)}</Badge>;
            },
        },
    ];

    const templateOptions = templates.map((t) => ({ value: String(t.id), label: t.templateName }));

    return (
        <>
            <DataTable
                rows={scoped}
                columns={columns}
                rowKey={(r) => r.id}
                mobile={{ title: (r) => r.studentName, subtitle: (r) => r.studentId }}
                searchPlaceholder="Search by student ID / name"
                filter={(r, q) => r.studentId.toLowerCase().includes(q) || r.studentName.toLowerCase().includes(q)}
                emptyMessage="No results"
                toolbar={
                    <>
                        <SimpleSelect value={batch} onChange={setBatch} options={batches} allowNone noneLabel="All Batches" placeholder="All Batches" className="w-[calc(50%-4px)] sm:w-40" />
                        <SimpleSelect value={className} onChange={setClassName} options={classes} allowNone noneLabel="All Classes" placeholder="All Classes" className="w-[calc(50%-4px)] sm:w-40" />
                        <SimpleSelect value={templateId} onChange={setTemplateId} options={templateOptions} placeholder="SMS Template" className="w-full sm:w-44" />
                        <Link href="/add-result" className={buttonVariants({ className: "w-full sm:w-auto" })}>
                            <Plus /> Add Result
                        </Link>
                    </>
                }
                actions={(r) => (
                    <>
                        <Button size="sm" variant="outline" onClick={() => setView(r)} title="View">
                            <Eye /> <span className="md:hidden">View</span>
                        </Button>
                        <Link href={`/edit-result/${r.id}`} className={buttonVariants({ size: "sm", variant: "outline" })} title="Edit">
                            <Pencil /> <span className="md:hidden">Edit</span>
                        </Link>
                        <Button size="sm" onClick={() => sendSms(r)} disabled={!templateId || sendingId === r.id} title={templateId ? "Send SMS" : "Select an SMS template"}>
                            <MessageSquare /> {sendingId === r.id ? "Sending..." : "SMS"}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(r)} title="Delete">
                            <Trash2 /> <span className="md:hidden">Delete</span>
                        </Button>
                    </>
                )}
            />

            <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
                <DialogContent className="sm:max-w-3xl">
                    {view && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Result — {view.studentName}</DialogTitle>
                            </DialogHeader>
                            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <DetailRow label="Student ID" value={view.studentId} mono />
                                <DetailRow label="Batch" value={view.batch} />
                                <DetailRow label="Type" value={view.resultType} />
                                <DetailRow label="Exam Date" value={formatDate(view.examDate)} />
                            </dl>
                            <div className="overflow-hidden rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>SL</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>MCQ</TableHead>
                                            <TableHead>Written</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>%</TableHead>
                                            <TableHead>GPA</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {view.subjects.map((s, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{i + 1}</TableCell>
                                                <TableCell className="font-semibold">{s.className}</TableCell>
                                                <TableCell>{s.mcqGain}/{s.mcqTotal}</TableCell>
                                                <TableCell>{s.quesGain}/{s.quesTotal}</TableCell>
                                                <TableCell>{s.totalGain}/{s.totalMarks}</TableCell>
                                                <TableCell>{percentOf(s.totalGain, s.totalMarks).toFixed(2)}%</TableCell>
                                                <TableCell>{gpaLabel(s.totalGain, s.totalMarks)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/50 font-bold">
                                            <TableCell colSpan={4} className="text-right">Grand Total</TableCell>
                                            <TableCell>{view.totalGain}/{view.totalMarks}</TableCell>
                                            <TableCell>{percentOf(view.totalGain, view.totalMarks).toFixed(2)}%</TableCell>
                                            <TableCell>{gpaLabel(view.totalGain, view.totalMarks)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setView(null)}>
                                    Close
                                </Button>
                                <Button onClick={() => print(view)}>
                                    <Printer /> Print Mark Sheet
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
