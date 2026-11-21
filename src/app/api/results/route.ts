import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, parseBody, prismaError } from "@/lib/api";
import { listResults, resolveBatchId, resultInclude, serializeResult } from "@/lib/queries";
import { resultSchema, toExamDate, withTotals } from "@/lib/validation";
import { RESULT_TYPES } from "@/lib/types";

/** GET /api/results?q=&batch=&studentId=&resultType=&take= */
export async function GET(req: NextRequest) {
    const sp = req.nextUrl.searchParams;
    const resultType = sp.get("resultType") || undefined;
    const take = Number(sp.get("take")) || undefined;
    try {
        return ok(
            await listResults({
                q: sp.get("q") || undefined,
                batch: sp.get("batch") || undefined,
                studentId: sp.get("studentId") || undefined,
                resultType: resultType && (RESULT_TYPES as readonly string[]).includes(resultType) ? resultType : undefined,
                take: take ? Math.min(take, 500) : undefined,
            })
        );
    } catch (e) {
        return prismaError(e, "GET /api/results");
    }
}

export async function POST(req: Request) {
    const { data, error } = await parseBody(req, resultSchema);
    if (error) return error;
    try {
        const student = await prisma.student.findUnique({ where: { studentId: data.studentId } });
        if (!student) return fail("Student not found", 404);
        const { rows, totalMarks, totalGain } = withTotals(data.subjects);

        const created = await prisma.result.create({
            data: {
                batchId: await resolveBatchId(data.batch),
                studentRefId: student.id,
                studentName: data.studentName,
                resultType: data.resultType,
                examDate: toExamDate(data.examDate) ?? new Date(),
                totalMarks,
                totalGain,
                subjects: { create: rows },
            },
            include: resultInclude,
        });
        return ok(serializeResult(created), 201);
    } catch (e) {
        return prismaError(e, "POST /api/results");
    }
}
