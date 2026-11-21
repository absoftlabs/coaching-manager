"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/shared/data-table";
import { useConfirm } from "@/components/shared/confirm";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ClassDTO } from "@/lib/types";

export function ClassList({ rows }: { rows: ClassDTO[] }) {
    const confirm = useConfirm();
    const [data, setData] = useState(rows);

    async function onDelete(c: ClassDTO) {
        const ok = await confirm({ title: `Delete ${c.name}?`, description: "This cannot be undone.", confirmText: "Delete", destructive: true });
        if (!ok) return;
        const res = await fetch(`/api/classes/${c.id}`, { method: "DELETE" });
        if (res.ok) {
            setData((prev) => prev.filter((x) => x.id !== c.id));
            toast.success("Class deleted");
        } else toast.error("Failed to delete");
    }

    const columns: Column<ClassDTO>[] = [
        { key: "name", header: "Name", hideOnMobile: true, cell: (r) => <span className="font-semibold">{r.name}</span> },
        { key: "code", header: "Code", hideOnMobile: true, cell: (r) => <span className="font-mono text-xs">{r.code}</span> },
        { key: "teacher", header: "Teacher", cell: (r) => r.teacher || "-" },
        { key: "batch", header: "Batch", cell: (r) => r.batch || "-" },
        { key: "days", header: "Days", className: "wide", cell: (r) => (r.days.length ? r.days.join(", ") : "-") },
        {
            key: "status",
            header: "Status",
            cell: (r) => <Badge variant={r.isActive ? "success" : "secondary"}>{r.isActive ? "Active" : "Inactive"}</Badge>,
        },
    ];

    return (
        <DataTable
            rows={data}
            columns={columns}
            rowKey={(r) => r.id}
            mobile={{ title: (r) => r.name, subtitle: (r) => r.code }}
            searchPlaceholder="Name / code / teacher / batch"
            filter={(r, q) => [r.name, r.code, r.teacher, r.batch].some((v) => v.toLowerCase().includes(q))}
            emptyMessage="No classes"
            toolbar={
                <Link href="/add-class" className={buttonVariants({ className: "w-full sm:w-auto" })}>
                    <Plus /> Add Class
                </Link>
            }
            actions={(r) => (
                <>
                    <Link href={`/edit-class/${r.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                        <Pencil /> Edit
                    </Link>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(r)}>
                        <Trash2 /> Delete
                    </Button>
                </>
            )}
        />
    );
}
