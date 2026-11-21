import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, ok, parseBody, prismaError } from "@/lib/api";
import { listBatches } from "@/lib/queries";

export async function GET() {
    try {
        return ok(await listBatches());
    } catch (error) {
        return prismaError(error, "GET /api/batches");
    }
}

const schema = z.object({ name: z.string().trim().min(1, "Batch name is required") });

export async function POST(req: Request) {
    const { data, error } = await parseBody(req, schema);
    if (error) return error;
    try {
        const exists = await prisma.batch.findUnique({ where: { name: data.name } });
        if (exists) return fail("Batch name already exists", 409);
        const batch = await prisma.batch.create({ data: { name: data.name } });
        return ok({ id: batch.id, name: batch.name, totalClass: 0, totalStudent: 0 }, 201);
    } catch (e) {
        return prismaError(e, "POST /api/batches");
    }
}
