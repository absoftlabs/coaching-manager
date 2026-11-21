import { prisma } from "@/lib/prisma";
import { fail, ok, parseId, prismaError } from "@/lib/api";
import { resetTeacherPassword } from "@/lib/teacher-account";

type Ctx = { params: Promise<{ id: string }> };

/** Resets (or creates) the teacher's login and returns the password once. */
export async function POST(_req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    try {
        const teacher = await prisma.teacher.findUnique({ where: { id } });
        if (!teacher) return fail("Not found", 404);
        return ok(await resetTeacherPassword(id, teacher.phone));
    } catch (e) {
        return prismaError(e, "POST /api/teachers/:id/reset-password");
    }
}
