import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fail, ok, parseBody, prismaError } from "@/lib/api";
import { listStudents, resolveBatchId, serializeStudent } from "@/lib/queries";
import { studentSchema } from "@/lib/validation";

/** GET /api/students?q=&batch=&roll=&suspended=true|false&take= */
export async function GET(req: NextRequest) {
    const sp = req.nextUrl.searchParams;
    const suspended = sp.get("suspended");
    const take = Number(sp.get("take")) || undefined;
    try {
        const rows = await listStudents({
            q: sp.get("q") || undefined,
            batch: sp.get("batch") || undefined,
            roll: sp.get("roll") || undefined,
            suspended: suspended === "true" ? true : suspended === "false" ? false : undefined,
            take: take ? Math.min(take, 500) : undefined,
        });
        return ok(rows);
    } catch (e) {
        return prismaError(e, "GET /api/students");
    }
}

const random5 = () => String(Math.floor(Math.random() * 100000)).padStart(5, "0");

/** POST /api/students — allocates a unique PCC-xxxxx student ID. */
export async function POST(req: Request) {
    const { data, error } = await parseBody(req, studentSchema);
    if (error) return error;

    try {
        const { batch, isSuspended, ...fields } = data;
        const batchId = await resolveBatchId(batch);

        // Try-create-and-retry instead of check-then-create, which races.
        for (let attempt = 0; attempt < 10; attempt++) {
            try {
                const created = await prisma.student.create({
                    data: { ...fields, studentId: `PCC-${random5()}`, batchId, isSuspended: !!isSuspended },
                    include: { batch: true },
                });
                return ok(serializeStudent(created), 201);
            } catch (e) {
                const isIdClash =
                    e instanceof Prisma.PrismaClientKnownRequestError &&
                    e.code === "P2002" &&
                    String(e.meta?.target ?? "").includes("studentId");
                if (!isIdClash) throw e;
            }
        }
        return fail("Failed to allocate a student ID. Try again.", 500);
    } catch (e) {
        return prismaError(e, "POST /api/students");
    }
}
