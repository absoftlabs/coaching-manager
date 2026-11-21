"use client";

import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendRow } from "@/lib/stats";

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const label = (ymd: string) => fmt.format(new Date(`${ymd}T00:00:00Z`));

export function AttendanceChart({ data }: { data: TrendRow[] }) {
    if (data.every((d) => d.present === 0 && d.absent === 0)) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
                <BarChart3 className="size-9 opacity-60" />
                <p className="text-sm">No attendance recorded yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-chart-1" /> Present
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-chart-2" /> Absent
                </span>
            </div>
            <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ left: -20, right: 4, top: 4 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={12}
                            tickFormatter={label}
                            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        />
                        <YAxis
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        />
                        <Tooltip
                            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
                            labelFormatter={(v) => label(String(v))}
                            contentStyle={{
                                background: "var(--popover)",
                                border: "1px solid var(--border)",
                                borderRadius: 10,
                                color: "var(--popover-foreground)",
                                fontSize: 12,
                            }}
                        />
                        <Bar dataKey="present" name="Present" stackId="a" fill="var(--chart-1)" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="absent" name="Absent" stackId="a" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
