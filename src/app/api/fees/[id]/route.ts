import { prisma } from "@/lib/prisma";
import { fail, ok, parseBody, parseId, prismaError } from "@/lib/api";
import { feeInclude, getFee, serializeFee } from "@/lib/queries";
import { feeSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    const fee = await getFee(id);
    return fee ? ok(fee) : fail("Not found", 404);
}

export async function PATCH(req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    const { data, error } = await parseBody(req, feeSchema);
    if (error) return error;
    try {
        const student = await prisma.student.findUnique({ where: { studentId: data.studentId } });
        if (!student) return fail("Student not found", 404);
        const updated = await prisma.fee.update({
            where: { id },
            data: {
                studentRefId: student.id,
                studentName: data.studentName,
                amount: data.amount,
                depositBy: data.depositBy,
                receivedBy: data.receivedBy,
            },
            include: feeInclude,
        });
        return ok(serializeFee(updated));
    } catch (e) {
        return prismaError(e, "PATCH /api/fees/:id");
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    try {
        await prisma.fee.delete({ where: { id } });
        return ok({ ok: true });
    } catch (e) {
        return prismaError(e, "DELETE /api/fees/:id");
    }
}
