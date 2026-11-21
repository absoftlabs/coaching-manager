import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api";

export async function GET() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return ok({ ok: true, db: "mysql" });
    } catch (e) {
        return fail(e instanceof Error ? e.message : "Database unreachable", 500);
    }
}
