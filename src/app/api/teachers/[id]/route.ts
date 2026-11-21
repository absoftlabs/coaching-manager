import { prisma } from "@/lib/prisma";
import { fail, ok, parseBody, parseId, prismaError } from "@/lib/api";
import { getTeacher } from "@/lib/queries";
import { teacherSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    const teacher = await getTeacher(id);
    return teacher ? ok(teacher) : fail("Not found", 404);
}

export async function PATCH(req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    const { data, error } = await parseBody(req, teacherSchema.partial());
    if (error) return error;

    try {
        const update = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
        const before = await prisma.teacher.findUnique({ where: { id }, select: { name: true } });
        if (!before) return fail("Not found", 404);
        await prisma.$transaction([
            prisma.teacher.update({ where: { id }, data: update }),
            // Classes reference the teacher by name — keep them in sync on rename.
            ...(data.name && data.name !== before.name
                ? [prisma.classSession.updateMany({ where: { teacher: before.name }, data: { teacher: data.name } })]
                : []),
        ]);
        return ok(await getTeacher(id));
    } catch (e) {
        return prismaError(e, "PATCH /api/teachers/:id");
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    try {
        // The linked login (admins.teacherId) cascades.
        await prisma.teacher.delete({ where: { id } });
        return ok({ ok: true });
    } catch (e) {
        return prismaError(e, "DELETE /api/teachers/:id");
    }
}
