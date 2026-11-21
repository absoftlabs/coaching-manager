"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/shared/data-table";
import { useConfirm } from "@/components/shared/confirm";
import { DetailRow } from "@/components/shared/misc";
import { useApp, useOrgLogo } from "@/components/providers";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { printFeeInvoice } from "@/lib/print";
import type { FeeDTO } from "@/lib/types";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";

export function FeeList({ rows }: { rows: FeeDTO[] }) {
    const { org } = useApp();
    const logo = useOrgLogo();
    const confirm = useConfirm();
    const [data, setData] = useState(rows);
    const [view, setView] = useState<FeeDTO | null>(null);
    const total = data.reduce((a, f) => a + f.amount, 0);

    async function onDelete(f: FeeDTO) {
        const ok = await confirm({
            title: "Delete this fee record?",
            description: `${f.studentName} — ${formatMoney(f.amount)}`,
            confirmText: "Delete",
            destructive: true,
        });
        if (!ok) return;
        const res = await fetch(`/api/fees/${f.id}`, { method: "DELETE" });
        if (res.ok) {
            setData((prev) => prev.filter((x) => x.id !== f.id));
            toast.success("Fee record deleted");
        } else toast.error("Delete failed");
    }

    const print = (f: FeeDTO) => printFeeInvoice(f, { ...org, logo });

    const columns: Column<FeeDTO>[] = [
        { key: "name", header: "Student Name", hideOnMobile: true, cell: (r) => <span className="font-semibold">{r.studentName}</span> },
        { key: "id", header: "Student ID", hideOnMobile: true, cell: (r) => <span className="font-mono text-xs">{r.studentId}</span> },
        { key: "amount", header: "Amount", cell: (r) => <span className="font-bold tabular-nums">{formatMoney(r.amount)}</span> },
        { key: "date", header: "Date", cell: (r) => formatDate(r.createdAt) },
        { key: "depositBy", header: "Deposit By", cell: (r) => r.depositBy },
        { key: "receivedBy", header: "Received By", cell: (r) => r.receivedBy },
    ];

    return (
        <div className="space-y-4">
            <Card className="flex-row items-center justify-between gap-4 px-4 py-4 sm:px-6">
                <div>
                    <div className="text-xs font-semibold text-muted-foreground">Total collected</div>
                    <div className="text-2xl font-extrabold tabular-nums">{formatMoney(total)}</div>
                </div>
                <div className="text-right text-xs text-muted-foreground">{data.length} receipts</div>
            </Card>

            <DataTable
                rows={data}
                columns={columns}
                rowKey={(r) => r.id}
                mobile={{ title: (r) => r.studentName, subtitle: (r) => r.studentId }}
                searchPlaceholder="Search student / depositor"
                filter={(r, q) => [r.studentName, r.studentId, r.depositBy].some((v) => v.toLowerCase().includes(q))}
                emptyMessage="No fee records"
                toolbar={
                    <Link href="/add-fees" className={buttonVariants({ className: "w-full sm:w-auto" })}>
                        <Plus /> Collect Fee
                    </Link>
                }
                actions={(r) => (
                    <>
                        <Button size="sm" variant="outline" onClick={() => setView(r)} title="View">
                            <Eye /> <span className="md:hidden">View</span>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => print(r)} title="Print receipt">
                            <Printer /> <span className="md:hidden">Print</span>
                        </Button>
                        <Link href={`/edit-fee/${r.id}`} className={buttonVariants({ size: "sm", variant: "outline" })} title="Edit">
                            <Pencil /> <span className="md:hidden">Edit</span>
                        </Link>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(r)} title="Delete">
                            <Trash2 /> <span className="md:hidden">Delete</span>
                        </Button>
                    </>
                )}
            />

            <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
                <DialogContent>
                    {view && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Fee Details</DialogTitle>
                            </DialogHeader>
                            <div className="rounded-xl bg-accent/50 p-4 text-center">
                                <div className="text-xs font-semibold text-muted-foreground">Amount</div>
                                <div className="text-3xl font-extrabold tabular-nums">{formatMoney(view.amount)}</div>
                            </div>
                            <dl className="space-y-3">
                                <DetailRow label="Receipt No" value={`#${view.id}`} />
                                <DetailRow label="Student" value={view.studentName} />
                                <DetailRow label="Student ID" value={view.studentId} mono />
                                <DetailRow label="Deposit By" value={view.depositBy} />
                                <DetailRow label="Received By" value={view.receivedBy} />
                                <DetailRow label="Date" value={formatDateTime(view.createdAt)} />
                            </dl>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setView(null)}>
                                    Close
                                </Button>
                                <Button onClick={() => print(view)}>
                                    <Printer /> Print Receipt
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
