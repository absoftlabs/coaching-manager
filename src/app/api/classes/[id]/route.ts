import { prisma } from "@/lib/prisma";
import { fail, ok, parseBody, parseId, prismaError } from "@/lib/api";
import { getClass, resolveBatchId, serializeClass } from "@/lib/queries";
import { classSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    const item = await getClass(id);
    return item ? ok(item) : fail("Not found", 404);
}

export async function PATCH(req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    const { data, error } = await parseBody(req, classSchema);
    if (error) return error;
    try {
        const updated = await prisma.classSession.update({
            where: { id },
            data: {
                name: data.name,
                code: data.code,
                teacher: data.teacher,
                days: data.days,
                isActive: data.isActive,
                batch: data.batch
                    ? { connect: { id: await resolveBatchId(data.batch) } }
                    : { disconnect: true },
            },
            include: { batch: true },
        });
        return ok(serializeClass(updated));
    } catch (e) {
        return prismaError(e, "PATCH /api/classes/:id");
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    try {
        await prisma.classSession.delete({ where: { id } });
        return ok({ ok: true });
    } catch (e) {
        return prismaError(e, "DELETE /api/classes/:id");
    }
}
