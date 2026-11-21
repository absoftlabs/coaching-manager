"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Printer, Trash2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/shared/data-table";
import { useConfirm } from "@/components/shared/confirm";
import { SimpleSelect } from "@/components/shared/form";
import { DetailRow } from "@/components/shared/misc";
import { useApp, useOrgLogo } from "@/components/providers";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { printStudentProfile } from "@/lib/print";
import type { StudentDTO } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function StudentList({
    rows,
    batches = [],
    suspendedOnly = false,
}: {
    rows: StudentDTO[];
    batches?: string[];
    suspendedOnly?: boolean;
}) {
    const { org } = useApp();
    const logo = useOrgLogo();
    const confirm = useConfirm();
    const [data, setData] = useState(rows);
    const [batch, setBatch] = useState("");
    const [roll, setRoll] = useState("");
    const [view, setView] = useState<StudentDTO | null>(null);

    const scoped = data
        .filter((r) => r.isSuspended === suspendedOnly)
        .filter((r) => !batch || r.batch === batch)
        .filter((r) => !roll.trim() || r.roll === roll.trim());

    async function onDelete(s: StudentDTO) {
        const ok = await confirm({
            title: `Delete ${s.name}?`,
            description: "This cannot be undone. Students with fees, results or attendance can't be deleted — suspend them instead.",
            confirmText: "Delete",
            destructive: true,
        });
        if (!ok) return;
        const res = await fetch(`/api/students/${s.id}`, { method: "DELETE" });
        if (res.ok) {
            setData((prev) => prev.filter((x) => x.id !== s.id));
            toast.success("Student deleted");
        } else {
            const j = (await res.json().catch(() => null)) as { error?: string } | null;
            toast.error(j?.error ?? "Delete failed");
        }
    }

    async function onToggleSuspend(s: StudentDTO) {
        const suspend = !s.isSuspended;
        const ok = await confirm({ title: suspend ? `Suspend ${s.name}?` : `Re-admit ${s.name}?`, confirmText: suspend ? "Suspend" : "Re-admit" });
        if (!ok) return;
        const res = await fetch(`/api/students/${s.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isSuspended: suspend }),
        });
        if (res.ok) {
            setData((prev) => prev.map((x) => (x.id === s.id ? { ...x, isSuspended: suspend } : x)));
            toast.success(suspend ? "Student suspended" : "Student re-admitted");
        } else toast.error("Action failed");
    }

    const columns: Column<StudentDTO>[] = [
        { key: "photo", header: "", hideOnMobile: true, cell: (r) => <Avatar src={r.photoUrl} name={r.name} className="size-9" /> },
        { key: "studentId", header: "Student ID", hideOnMobile: true, cell: (r) => <span className="font-mono text-xs">{r.studentId}</span> },
        { key: "name", header: "Name", hideOnMobile: true, cell: (r) => <span className="font-semibold">{r.name}</span> },
        { key: "batch", header: "Batch", cell: (r) => r.batch },
        { key: "roll", header: "Roll", cell: (r) => r.roll },
        { key: "division", header: "Group", cell: (r) => r.division || "-" },
        { key: "phone", header: "Guardian Phone", cell: (r) => r.guardianPhone || "-" },
    ];

    return (
        <>
            <DataTable
                rows={scoped}
                columns={columns}
                rowKey={(r) => r.id}
                mobile={{
                    title: (r) => r.name,
                    subtitle: (r) => r.studentId,
                    leading: (r) => <Avatar src={r.photoUrl} name={r.name} className="size-11" />,
                }}
                searchPlaceholder="Name, ID, batch, roll, phone"
                filter={(r, q) =>
                    [r.name, r.studentId, r.batch, r.roll, r.guardianName ?? "", r.guardianPhone ?? ""].some((v) =>
                        v.toLowerCase().includes(q)
                    )
                }
                emptyMessage={suspendedOnly ? "No suspended students" : "No students"}
                toolbar={
                    <>
                        {batches.length > 0 && (
                            <SimpleSelect
                                value={batch}
                                onChange={setBatch}
                                options={batches}
                                allowNone
                                noneLabel="All Batches"
                                placeholder="All Batches"
                                className="w-[calc(50%-4px)] sm:w-44"
                            />
                        )}
                        <Input
                            className="w-[calc(50%-4px)] sm:w-24"
                            placeholder="Roll"
                            inputMode="numeric"
                            value={roll}
                            onChange={(e) => setRoll(e.target.value)}
                        />
                        {!suspendedOnly && (
                            <Link href="/add-student" className={buttonVariants({ className: "w-full sm:w-auto" })}>
                                <Plus /> Add Student
                            </Link>
                        )}
                    </>
                }
                actions={(r) => (
                    <>
                        <Button size="sm" variant="outline" onClick={() => setView(r)} title="View">
                            <Eye /> <span className="md:hidden">View</span>
                        </Button>
                        <Link href={`/edit-student/${r.id}`} className={buttonVariants({ size: "sm", variant: "outline" })} title="Edit">
                            <Pencil /> <span className="md:hidden">Edit</span>
                        </Link>
                        <Button size="sm" variant={r.isSuspended ? "success" : "secondary"} onClick={() => onToggleSuspend(r)}>
                            {r.isSuspended ? <UserCheck /> : <UserX />}
                            {r.isSuspended ? "Re-admit" : "Suspend"}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(r)} title="Delete">
                            <Trash2 /> <span className="md:hidden">Delete</span>
                        </Button>
                    </>
                )}
            />

            <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
                <DialogContent className="sm:max-w-2xl">
                    {view && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-4">
                                    <Avatar src={view.photoUrl} name={view.name} className="size-16 rounded-xl text-lg" />
                                    <div className="min-w-0">
                                        <DialogTitle>{view.name}</DialogTitle>
                                        <div className="font-mono text-sm text-muted-foreground">{view.studentId}</div>
                                        {view.isSuspended && <Badge variant="destructive" className="mt-1">Suspended</Badge>}
                                    </div>
                                </div>
                            </DialogHeader>
                            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <DetailRow label="Batch" value={view.batch} />
                                <DetailRow label="Roll" value={view.roll} />
                                <DetailRow label="Group" value={view.division} />
                                <DetailRow label="Gender" value={view.gender} />
                                <DetailRow label="Birth Date" value={view.birthDate} />
                                <DetailRow label="Course Fee" value={view.courseFee != null ? formatMoney(view.courseFee) : null} />
                                <DetailRow label="School Name" value={view.schoolName} />
                                <DetailRow label="School Roll" value={view.schoolRoll} />
                                <DetailRow label="School Section" value={view.schoolSection} />
                                <DetailRow label="Address" value={view.address} />
                                <DetailRow label="Father" value={view.fatherName} />
                                <DetailRow label="Mother" value={view.motherName} />
                                <DetailRow label="Guardian" value={view.guardianName} />
                                <DetailRow label="Guardian Phone" value={view.guardianPhone} />
                            </dl>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setView(null)}>
                                    Close
                                </Button>
                                <Button onClick={() => printStudentProfile(view, { ...org, logo })}>
                                    <Printer /> Print
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
