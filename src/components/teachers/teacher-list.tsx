"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Pencil, Plus, Trash2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/shared/data-table";
import { useConfirm } from "@/components/shared/confirm";
import { CredentialsDialog } from "@/components/shared/credentials-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import type { Credentials, TeacherDTO } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

export function TeacherList({ rows, suspendedOnly = false }: { rows: TeacherDTO[]; suspendedOnly?: boolean }) {
    const confirm = useConfirm();
    const [data, setData] = useState(rows);
    const [credentials, setCredentials] = useState<Credentials | null>(null);
    const scoped = data.filter((r) => r.isSuspended === suspendedOnly);

    async function onReset(t: TeacherDTO) {
        const ok = await confirm({
            title: "Reset login password?",
            description: `${t.name}'s password will be reset to the default (123456). The old one stops working immediately.`,
            confirmText: "Reset",
        });
        if (!ok) return;
        const res = await fetch(`/api/teachers/${t.id}/reset-password`, { method: "POST" });
        if (res.ok) setCredentials(await res.json());
        else toast.error("Failed to reset password");
    }

    async function onToggle(t: TeacherDTO) {
        const suspend = !t.isSuspended;
        const ok = await confirm({
            title: suspend ? `Suspend ${t.name}?` : `Re-appoint ${t.name}?`,
            description: suspend ? "A suspended teacher can't log in." : undefined,
            confirmText: suspend ? "Suspend" : "Appoint",
        });
        if (!ok) return;
        const res = await fetch(`/api/teachers/${t.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isSuspended: suspend }),
        });
        if (res.ok) {
            setData((prev) => prev.map((x) => (x.id === t.id ? { ...x, isSuspended: suspend } : x)));
            toast.success(suspend ? "Teacher suspended" : "Teacher re-appointed");
        } else toast.error("Action failed");
    }

    async function onDelete(t: TeacherDTO) {
        const ok = await confirm({
            title: `Delete ${t.name}?`,
            description: "Their login is removed too. This cannot be undone.",
            confirmText: "Delete",
            destructive: true,
        });
        if (!ok) return;
        const res = await fetch(`/api/teachers/${t.id}`, { method: "DELETE" });
        if (res.ok) {
            setData((prev) => prev.filter((x) => x.id !== t.id));
            toast.success("Teacher deleted");
        } else toast.error("Delete failed");
    }

    const columns: Column<TeacherDTO>[] = [
        { key: "photo", header: "", hideOnMobile: true, cell: (r) => <Avatar src={r.imageUrl} name={r.name} className="size-9" /> },
        { key: "name", header: "Name", hideOnMobile: true, cell: (r) => <span className="font-semibold">{r.name}</span> },
        { key: "phone", header: "Phone", cell: (r) => r.phone || "-" },
        { key: "subject", header: "Primary Subject", hideOnMobile: true, cell: (r) => r.primarySubject || "-" },
        { key: "classes", header: "Classes", cell: (r) => r.totalAssignedClass },
        { key: "joinDate", header: "Join Date", cell: (r) => formatDate(r.joinDate) },
        { key: "salary", header: "Salary", cell: (r) => (r.salary != null ? formatMoney(r.salary) : "-") },
        { key: "login", header: "Login", cell: (r) => <span className="font-mono text-xs">{r.username ?? "—"}</span> },
    ];

    return (
        <>
            <DataTable
                rows={scoped}
                columns={columns}
                rowKey={(r) => r.id}
                mobile={{
                    title: (r) => r.name,
                    subtitle: (r) => r.primarySubject,
                    leading: (r) => <Avatar src={r.imageUrl} name={r.name} className="size-11" />,
                }}
                searchPlaceholder="Search by name / subject / phone"
                filter={(r, q) => [r.name, r.primarySubject ?? "", r.phone ?? ""].some((v) => v.toLowerCase().includes(q))}
                emptyMessage={suspendedOnly ? "No suspended teachers" : "No teachers"}
                toolbar={
                    !suspendedOnly && (
                        <Link href="/add-teacher" className={buttonVariants({ className: "w-full sm:w-auto" })}>
                            <Plus /> Add Teacher
                        </Link>
                    )
                }
                actions={(r) => (
                    <>
                        <Link href={`/edit-teacher/${r.id}`} className={buttonVariants({ size: "sm", variant: "outline" })} title="Edit">
                            <Pencil /> <span className="md:hidden">Edit</span>
                        </Link>
                        <Button size="sm" variant="outline" onClick={() => onReset(r)} title="Reset password">
                            <KeyRound /> <span className="md:hidden lg:inline">Reset</span>
                        </Button>
                        <Button size="sm" variant={r.isSuspended ? "success" : "secondary"} onClick={() => onToggle(r)}>
                            {r.isSuspended ? <UserCheck /> : <UserX />}
                            {r.isSuspended ? "Appoint" : "Suspend"}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(r)} title="Delete">
                            <Trash2 /> <span className="md:hidden">Delete</span>
                        </Button>
                    </>
                )}
            />
            <CredentialsDialog
                credentials={credentials}
                title="Password reset"
                description="The login now uses the default password below. Ask the teacher to change it after logging in."
                onClose={() => setCredentials(null)}
            />
        </>
    );
}
