import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, parseBody, prismaError } from "@/lib/api";
import { getTeacher, listTeachers } from "@/lib/queries";
import { createTeacherAccount } from "@/lib/teacher-account";
import { teacherSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
    const sp = req.nextUrl.searchParams;
    const suspended = sp.get("suspended");
    try {
        return ok(
            await listTeachers({
                q: sp.get("q") || undefined,
                suspended: suspended === "true" ? true : suspended === "false" ? false : undefined,
            })
        );
    } catch (e) {
        return prismaError(e, "GET /api/teachers");
    }
}

/** Creates the teacher plus a "teacher" login; returns the one-time credentials. */
export async function POST(req: Request) {
    const { data, error } = await parseBody(req, teacherSchema);
    if (error) return error;

    try {
        const created = await prisma.teacher.create({
            data: {
                name: data.name,
                phone: data.phone,
                primarySubject: data.primarySubject,
                imageUrl: data.imageUrl ?? null,
                joinDate: data.joinDate ?? null,
                salary: data.salary ?? null,
            },
        });

        let credentials;
        try {
            credentials = await createTeacherAccount(created.id, data.phone);
        } catch (e) {
            // Don't leave a teacher with no way to log in.
            await prisma.teacher.delete({ where: { id: created.id } });
            throw e;
        }

        return ok({ teacher: await getTeacher(created.id), credentials }, 201);
    } catch (e) {
        return prismaError(e, "POST /api/teachers");
    }
}
