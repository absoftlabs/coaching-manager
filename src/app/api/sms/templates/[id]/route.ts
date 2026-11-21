import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, ok, parseBody, parseId, prismaError } from "@/lib/api";
import { serializeTemplate } from "@/lib/queries";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
    templateName: z.string().trim().min(1, "Template name is required"),
    templateBody: z.string().trim().min(1, "Template body is required"),
});

export async function GET(_req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    const t = await prisma.smsTemplate.findUnique({ where: { id } });
    return t ? ok(serializeTemplate(t)) : fail("Not found", 404);
}

export async function PUT(req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    const { data, error } = await parseBody(req, schema);
    if (error) return error;
    try {
        return ok(serializeTemplate(await prisma.smsTemplate.update({ where: { id }, data })));
    } catch (e) {
        return prismaError(e, "PUT /api/sms/templates/:id");
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    const id = parseId((await ctx.params).id);
    if (!id) return fail("Not found", 404);
    try {
        await prisma.smsTemplate.delete({ where: { id } });
        return ok({ ok: true });
    } catch (e) {
        return prismaError(e, "DELETE /api/sms/templates/:id");
    }
}
