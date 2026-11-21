"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/shared/data-table";
import { useConfirm } from "@/components/shared/confirm";
import { Field } from "@/components/shared/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { BatchDTO } from "@/lib/types";
import { readError } from "@/lib/utils";

export function BatchList({ rows }: { rows: BatchDTO[] }) {
    const confirm = useConfirm();
    const [data, setData] = useState(rows);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<BatchDTO | null>(null);
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);

    function openForm(item: BatchDTO | null) {
        setEditing(item);
        setName(item?.name ?? "");
        setOpen(true);
    }

    async function save(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        const res = await fetch(editing ? `/api/batches/${editing.id}` : "/api/batches", {
            method: editing ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim() }),
        });
        setSaving(false);
        if (!res.ok) {
            toast.error(await readError(res, "Failed to save"));
            return;
        }
        const saved = (await res.json()) as BatchDTO;
        if (editing) {
            setData((prev) => prev.map((x) => (x.id === saved.id ? { ...x, name: saved.name } : x)));
            toast.success("Batch updated");
        } else {
            setData((prev) => [saved, ...prev]);
            toast.success("Batch created");
        }
        setOpen(false);
    }

    async function onDelete(b: BatchDTO) {
        const ok = await confirm({
            title: `Delete batch "${b.name}"?`,
            description: "Batches that still have students, classes, results or attendance can't be deleted.",
            confirmText: "Delete",
            destructive: true,
        });
        if (!ok) return;
        const res = await fetch(`/api/batches/${b.id}`, { method: "DELETE" });
        if (res.ok) {
            setData((prev) => prev.filter((x) => x.id !== b.id));
            toast.success("Batch deleted");
        } else toast.error(await readError(res, "Failed to delete"));
    }

    const columns: Column<BatchDTO>[] = [
        { key: "name", header: "Batch Name", hideOnMobile: true, cell: (r) => <span className="font-semibold">{r.name}</span> },
        { key: "classes", header: "Total Class", cell: (r) => r.totalClass },
        { key: "students", header: "Total Student", cell: (r) => r.totalStudent },
    ];

    return (
        <>
            <DataTable
                rows={data}
                columns={columns}
                rowKey={(r) => r.id}
                mobile={{ title: (r) => r.name }}
                searchPlaceholder="Type batch name..."
                filter={(r, q) => r.name.toLowerCase().includes(q)}
                emptyMessage="No batches"
                toolbar={
                    <Button onClick={() => openForm(null)} className="w-full sm:w-auto">
                        <Plus /> Add Batch
                    </Button>
                }
                actions={(r) => (
                    <>
                        <Button size="sm" variant="outline" onClick={() => openForm(r)}>
                            <Pencil /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(r)}>
                            <Trash2 /> Delete
                        </Button>
                    </>
                )}
            />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <form onSubmit={save} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>{editing ? "Edit Batch" : "Add Batch"}</DialogTitle>
                        </DialogHeader>
                        <Field label="Batch Name" htmlFor="batchName" required>
                            <Input id="batchName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HSC-26 Batch A" autoFocus />
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving || !name.trim()}>
                                {saving ? "Saving..." : editing ? "Update Batch" : "Save Batch"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
