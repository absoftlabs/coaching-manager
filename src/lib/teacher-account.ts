import "server-only";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Credentials } from "@/lib/types";

// New and reset teacher logins start on this password; the teacher changes it
// from the Change Password page afterwards.
export const DEFAULT_TEACHER_PASSWORD = "123456";

function baseUsername(teacherId: number, phone?: string | null) {
    return (phone ?? "").trim() || `teacher${teacherId}`;
}

/** Creates the "teacher" login (username = phone), retrying once on a clash. */
export async function createTeacherAccount(teacherId: number, phone?: string | null): Promise<Credentials> {
    const base = baseUsername(teacherId, phone);
    const passwordHash = await bcrypt.hash(DEFAULT_TEACHER_PASSWORD, 10);

    for (const username of [base, `${base}-${teacherId}`]) {
        try {
            await prisma.admin.create({ data: { username, passwordHash, role: "teacher", teacherId } });
            return { username, password: DEFAULT_TEACHER_PASSWORD };
        } catch (error) {
            const clash =
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002" &&
                String(error.meta?.target ?? "").includes("username");
            if (!clash) throw error;
        }
    }
    throw new Error(`Could not allocate a unique login username for teacher ${teacherId}`);
}

/** Resets (or lazily creates) a teacher's login to the default password. */
export async function resetTeacherPassword(teacherId: number, phone?: string | null): Promise<Credentials> {
    const existing = await prisma.admin.findUnique({ where: { teacherId } });
    if (!existing) return createTeacherAccount(teacherId, phone);

    const passwordHash = await bcrypt.hash(DEFAULT_TEACHER_PASSWORD, 10);
    await prisma.admin.update({ where: { id: existing.id }, data: { passwordHash, passwordChangedAt: new Date() } });
    return { username: existing.username, password: DEFAULT_TEACHER_PASSWORD };
}
