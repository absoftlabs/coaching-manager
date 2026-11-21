import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, parseBody, prismaError } from "@/lib/api";
import { listClasses, resolveBatchId, serializeClass } from "@/lib/queries";
import { classSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
    const sp = req.nextUrl.searchParams;
    try {
        return ok(await listClasses({ q: sp.get("q") || undefined, batch: sp.get("batch") || undefined }));
    } catch (e) {
        return prismaError(e, "GET /api/classes");
    }
}

export async function POST(req: Request) {
    const { data, error } = await parseBody(req, classSchema);
    if (error) return error;
    try {
        const created = await prisma.classSession.create({
            data: {
                name: data.name,
                code: data.code,
                teacher: data.teacher,
                batchId: data.batch ? await resolveBatchId(data.batch) : null,
                days: data.days,
                isActive: data.isActive,
            },
            include: { batch: true },
        });
        return ok(serializeClass(created), 201);
    } catch (e) {
        return prismaError(e, "POST /api/classes");
    }
}
