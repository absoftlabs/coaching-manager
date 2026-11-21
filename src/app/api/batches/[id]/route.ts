import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, ok, parseBody, parseId, prismaError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ name: z.string().trim().min(1, "Batch name is required") });

export async function PATCH(req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    const { data, error } = await parseBody(req, schema);
    if (error) return error;
    try {
        const dup = await prisma.batch.findFirst({ where: { name: data.name, id: { not: id } } });
        if (dup) return fail("Batch name already exists", 409);
        const batch = await prisma.batch.update({ where: { id }, data: { name: data.name } });
        return ok({ id: batch.id, name: batch.name });
    } catch (e) {
        return prismaError(e, "PATCH /api/batches/:id");
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    try {
        await prisma.batch.delete({ where: { id } });
        return ok({ ok: true });
    } catch (e) {
        return prismaError(e, "DELETE /api/batches/:id");
    }
}
