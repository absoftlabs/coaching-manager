import Link from "next/link";
import { CalendarCheck, GraduationCap, MessageSquare, Presentation, Wallet, UserPlus, ClipboardList, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceChart } from "@/components/dashboard/attendance-chart";
import { getAttendanceTrend, getDashboardStats } from "@/lib/stats";
import { formatMoney, cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const QUICK = [
    { href: "/add-student", label: "Add Student", icon: UserPlus },
    { href: "/attendance", label: "Attendance", icon: CalendarCheck },
    { href: "/add-fees", label: "Collect Fee", icon: Receipt },
    { href: "/add-result", label: "Add Result", icon: ClipboardList },
];

export default async function DashboardPage() {
    const [stats, trend] = await Promise.all([getDashboardStats(), getAttendanceTrend(14)]);

    const tiles = [
        { label: "Total Students", value: stats.totalStudents, sub: "Enrolled", icon: GraduationCap, tone: "bg-primary/12 text-primary" },
        { label: "Present Today", value: stats.presentToday, sub: "Students", icon: CalendarCheck, tone: "bg-success/15 text-success" },
        { label: "Collected Fees", value: formatMoney(stats.collectedFees), sub: "Tuition fees", icon: Wallet, tone: "bg-warning/25 text-foreground" },
        { label: "Total Teachers", value: stats.totalTeachers, sub: "Faculty", icon: Presentation, tone: "bg-accent text-accent-foreground" },
        {
            label: "SMS Balance",
            value: stats.smsBalance === null ? "—" : formatMoney(stats.smsBalance),
            sub: stats.smsBalance === null ? "Set up in Settings" : "Remaining",
            icon: MessageSquare,
            tone: "bg-chart-2/20 text-foreground",
        },
    ];

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                {tiles.map((t, i) => (
                    <Card key={t.label} className={cn("gap-3 py-4", i === 4 && "col-span-2 lg:col-span-1")}>
                        <CardContent className="flex items-start justify-between gap-3 px-4">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-muted-foreground">{t.label}</p>
                                <p className="mt-1 truncate text-2xl font-extrabold tracking-tight tabular-nums sm:text-[26px]">
                                    {t.value}
                                </p>
                                <p className="text-[11px] text-muted-foreground">{t.sub}</p>
                            </div>
                            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", t.tone)}>
                                <t.icon className="size-5" />
                            </span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:hidden">
                {QUICK.map((q) => (
                    <Link
                        key={q.href}
                        href={q.href}
                        className="flex flex-col items-center gap-1.5 rounded-xl border bg-card px-1 py-3 text-center text-[11px] font-semibold shadow-xs active:scale-[0.98]"
                    >
                        <q.icon className="size-5 text-primary" />
                        {q.label}
                    </Link>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Attendance Trend</CardTitle>
                    <CardDescription>Present vs absent students over the last 14 days</CardDescription>
                </CardHeader>
                <CardContent>
                    <AttendanceChart data={trend} />
                </CardContent>
            </Card>
        </div>
    );
}
