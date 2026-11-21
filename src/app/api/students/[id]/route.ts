import { prisma } from "@/lib/prisma";
import { fail, ok, parseBody, parseId, prismaError } from "@/lib/api";
import { getStudent, resolveBatchId, serializeStudent } from "@/lib/queries";
import { studentSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    const student = await getStudent(id);
    return student ? ok(student) : fail("Not found", 404);
}

/** PATCH accepts any subset of the student fields (e.g. just { isSuspended }). */
export async function PATCH(req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    const { data, error } = await parseBody(req, studentSchema.partial());
    if (error) return error;

    try {
        const { batch, ...fields } = data;
        const update = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
        const updated = await prisma.student.update({
            where: { id },
            data: {
                ...update,
                ...(batch ? { batch: { connect: { id: await resolveBatchId(batch) } } } : {}),
            },
            include: { batch: true },
        });
        return ok(serializeStudent(updated));
    } catch (e) {
        return prismaError(e, "PATCH /api/students/:id");
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    try {
        await prisma.student.delete({ where: { id } });
        return ok({ ok: true });
    } catch (e) {
        return prismaError(e, "DELETE /api/students/:id");
    }
}
