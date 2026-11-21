import { prisma } from "@/lib/prisma";
import { fail, ok, parseBody, parseId, prismaError } from "@/lib/api";
import { getResult, resolveBatchId, resultInclude, serializeResult } from "@/lib/queries";
import { resultSchema, toExamDate, withTotals } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    const result = await getResult(id);
    return result ? ok(result) : fail("Not found", 404);
}

export async function PATCH(req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    const { data, error } = await parseBody(req, resultSchema);
    if (error) return error;
    try {
        const student = await prisma.student.findUnique({ where: { studentId: data.studentId } });
        if (!student) return fail("Student not found", 404);
        const { rows, totalMarks, totalGain } = withTotals(data.subjects);

        const updated = await prisma.result.update({
            where: { id },
            data: {
                batch: { connect: { id: await resolveBatchId(data.batch) } },
                student: { connect: { id: student.id } },
                studentName: data.studentName,
                resultType: data.resultType,
                examDate: toExamDate(data.examDate),
                totalMarks,
                totalGain,
                subjects: { deleteMany: {}, create: rows },
            },
            include: resultInclude,
        });
        return ok(serializeResult(updated));
    } catch (e) {
        return prismaError(e, "PATCH /api/results/:id");
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    try {
        await prisma.result.delete({ where: { id } });
        return ok({ ok: true });
    } catch (e) {
        return prismaError(e, "DELETE /api/results/:id");
    }
}
