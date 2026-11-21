import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, ok, parseBody, prismaError } from "@/lib/api";
import { listAttendance } from "@/lib/queries";
import { isYmd, todayYmd } from "@/lib/date";

/** GET /api/attendance?date=YYYY-MM-DD&status=Present|Absent&batch=&q= */
export async function GET(req: NextRequest) {
    const sp = req.nextUrl.searchParams;
    const date = sp.get("date");
    const status = sp.get("status");
    try {
        return ok(
            await listAttendance({
                date: isYmd(date) ? date : todayYmd(),
                status: status === "Present" || status === "Absent" ? status : undefined,
                batch: sp.get("batch") || undefined,
                q: sp.get("q") || undefined,
            })
        );
    } catch (e) {
        return prismaError(e, "GET /api/attendance");
    }
}

const markSchema = z.object({
    date: z.string().optional(),
    studentId: z.string().trim().min(1),
    status: z.enum(["Present", "Absent"]),
});

/** PUT /api/attendance — upserts one student's status for a date. */
export async function PUT(req: Request) {
    const { data, error } = await parseBody(req, markSchema);
    if (error) return error;
    const date = isYmd(data.date) ? data.date : todayYmd();
    try {
        const student = await prisma.student.findUnique({ where: { studentId: data.studentId } });
        if (!student) return fail("Student not found", 404);
        const row = await prisma.attendance.upsert({
            where: { date_studentRefId: { date, studentRefId: student.id } },
            update: { studentName: student.name, batchId: student.batchId, status: data.status },
            create: {
                date,
                studentRefId: student.id,
                studentName: student.name,
                batchId: student.batchId,
                status: data.status,
            },
        });
        return ok({ ok: true, id: row.id });
    } catch (e) {
        return prismaError(e, "PUT /api/attendance");
    }
}

const bulkSchema = z.object({
    date: z.string().optional(),
    batch: z.string().trim().min(1),
    status: z.enum(["Present", "Absent"]),
});

/** POST /api/attendance — marks every active student of a batch at once. */
export async function POST(req: Request) {
    const { data, error } = await parseBody(req, bulkSchema);
    if (error) return error;
    const date = isYmd(data.date) ? data.date : todayYmd();
    try {
        const students = await prisma.student.findMany({
            where: { batch: { name: data.batch }, isSuspended: false },
        });
        await prisma.$transaction(
            students.map((s) =>
                prisma.attendance.upsert({
                    where: { date_studentRefId: { date, studentRefId: s.id } },
                    update: { studentName: s.name, batchId: s.batchId, status: data.status },
                    create: { date, studentRefId: s.id, studentName: s.name, batchId: s.batchId, status: data.status },
                })
            )
        );
        return ok({ ok: true, count: students.length });
    } catch (e) {
        return prismaError(e, "POST /api/attendance");
    }
}

/** DELETE /api/attendance — clears one student's mark for a date. */
export async function DELETE(req: Request) {
    const { data, error } = await parseBody(req, z.object({ date: z.string().optional(), studentId: z.string().min(1) }));
    if (error) return error;
    const date = isYmd(data.date) ? data.date : todayYmd();
    const student = await prisma.student.findUnique({ where: { studentId: data.studentId } });
    if (!student) return ok({ ok: false });
    const res = await prisma.attendance.deleteMany({ where: { date, studentRefId: student.id } });
    return ok({ ok: res.count > 0 });
}
