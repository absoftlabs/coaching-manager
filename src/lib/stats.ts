import "server-only";
import { prisma } from "@/lib/prisma";
import { getSmsConfig } from "@/lib/settings";
import { getSmsBalance } from "@/lib/sms/bulksms";
import { lastNDays, todayYmd } from "@/lib/date";

export type DashboardStats = {
    totalStudents: number;
    presentToday: number;
    collectedFees: number;
    totalTeachers: number;
    smsBalance: number | null;
};

export async function getDashboardStats(): Promise<DashboardStats> {
    const [totalStudents, totalTeachers, presentToday, feeSum] = await Promise.all([
        prisma.student.count(),
        prisma.teacher.count(),
        prisma.attendance.count({ where: { date: todayYmd(), status: "Present" } }),
        prisma.fee.aggregate({ _sum: { amount: true } }),
    ]);

    let smsBalance: number | null = null;
    try {
        const cfg = await getSmsConfig();
        if (cfg.apiKey) {
            const bal = await getSmsBalance(cfg.apiKey, cfg.apiUrl);
            smsBalance = bal.ok ? Number(bal.balance) || 0 : null;
        }
    } catch {
        smsBalance = null;
    }

    return {
        totalStudents,
        presentToday,
        collectedFees: feeSum._sum.amount ?? 0,
        totalTeachers,
        smsBalance,
    };
}

export type TrendRow = { date: string; present: number; absent: number };

export async function getAttendanceTrend(days = 14): Promise<TrendRow[]> {
    const dates = lastNDays(Math.min(60, Math.max(1, days)));
    const grouped = await prisma.attendance.groupBy({
        by: ["date", "status"],
        where: { date: { gte: dates[0] } },
        _count: { _all: true },
    });
    const counts = new Map<string, TrendRow>();
    for (const g of grouped) {
        const row = counts.get(g.date) ?? { date: g.date, present: 0, absent: 0 };
        if (g.status === "Present") row.present = g._count._all;
        else if (g.status === "Absent") row.absent = g._count._all;
        counts.set(g.date, row);
    }
    return dates.map((date) => counts.get(date) ?? { date, present: 0, absent: 0 });
}
