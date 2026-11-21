"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Inbox, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type Column<T> = {
    key: string;
    header: ReactNode;
    cell: (row: T) => ReactNode;
    className?: string;
    /** Hide this column in the phone card view (e.g. it is already in the card title). */
    hideOnMobile?: boolean;
};

type Props<T> = {
    rows: T[];
    columns: Column<T>[];
    rowKey: (row: T) => string | number;
    /** Phone card layout: title line, subtitle and leading media. */
    mobile: {
        title: (row: T) => ReactNode;
        subtitle?: (row: T) => ReactNode;
        leading?: (row: T) => ReactNode;
    };
    actions?: (row: T) => ReactNode;
    searchPlaceholder?: string;
    filter?: (row: T, query: string) => boolean;
    toolbar?: ReactNode;
    emptyMessage?: string;
};

/** Table on desktop, stacked cards on phones, with an optional search box. */
export function DataTable<T>({
    rows,
    columns,
    rowKey,
    mobile,
    actions,
    searchPlaceholder = "Search...",
    filter,
    toolbar,
    emptyMessage = "No records found",
}: Props<T>) {
    const [q, setQ] = useState("");
    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();
        return filter && query ? rows.filter((r) => filter(r, query)) : rows;
    }, [rows, q, filter]);

    const empty = (
        <div className="flex flex-col items-center justify-center gap-2 py-14 text-center text-muted-foreground">
            <Inbox className="size-9 opacity-60" />
            <p className="text-sm">{emptyMessage}</p>
        </div>
    );

    return (
        <div className="space-y-4">
            {(filter || toolbar) && (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    {filter ? (
                        <div className="relative w-full md:max-w-xs">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                placeholder={searchPlaceholder}
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div />
                    )}
                    {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
                </div>
            )}

            <div className="text-xs font-medium text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "record" : "records"}
            </div>

            {/* Desktop table */}
            <Card className="hidden gap-0 overflow-hidden py-0 md:flex">
                {filtered.length === 0 ? (
                    empty
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                {columns.map((c) => (
                                    <TableHead key={c.key} className={c.className}>
                                        {c.header}
                                    </TableHead>
                                ))}
                                {actions && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((row) => (
                                <TableRow key={rowKey(row)}>
                                    {columns.map((c) => (
                                        <TableCell key={c.key} className={c.className}>
                                            {c.cell(row)}
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1.5">{actions(row)}</div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* Phone cards */}
            <div className="space-y-3 md:hidden">
                {filtered.length === 0 ? (
                    <Card className="py-0">{empty}</Card>
                ) : (
                    filtered.map((row) => {
                        const visible = columns.filter((c) => !c.hideOnMobile);
                        return (
                            <Card key={rowKey(row)} className="gap-3 py-4">
                                <div className="flex items-start gap-3 px-4">
                                    {mobile.leading?.(row)}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-bold">{mobile.title(row)}</div>
                                        {mobile.subtitle && (
                                            <div className="truncate text-xs text-muted-foreground">{mobile.subtitle(row)}</div>
                                        )}
                                    </div>
                                </div>
                                {visible.length > 0 && (
                                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 text-sm">
                                        {visible.map((c) => (
                                            <div key={c.key} className={cn("min-w-0", c.className?.includes("wide") && "col-span-2")}>
                                                <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                                                    {c.header}
                                                </dt>
                                                <dd className="truncate font-medium">{c.cell(row)}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                )}
                                {actions && (
                                    <div className="flex flex-wrap gap-2 border-t px-4 pt-3 [&>*]:flex-1">{actions(row)}</div>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
