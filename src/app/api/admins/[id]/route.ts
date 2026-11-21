import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { fail, ok, parseId, prismaError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** Refuses to delete yourself or the last admin, so someone can always log in. */
export async function DELETE(req: NextRequest, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);

    const auth = await getAuthFromRequest(req);
    if (auth && Number(auth.sub) === id) return fail("You cannot delete your own account");

    try {
        const target = await prisma.admin.findUnique({ where: { id } });
        if (!target || target.role !== "admin") return fail("Not found", 404);
        if ((await prisma.admin.count({ where: { role: "admin" } })) <= 1) {
            return fail("At least one admin account must remain");
        }
        await prisma.admin.delete({ where: { id } });
        return ok({ ok: true });
    } catch (e) {
        return prismaError(e, "DELETE /api/admins/:id");
    }
}
