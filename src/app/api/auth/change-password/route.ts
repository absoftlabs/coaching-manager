import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest, signAuthToken, setAuthCookie } from "@/lib/auth";
import { fail, readJson } from "@/lib/api";

export async function POST(req: NextRequest) {
    const auth = await getAuthFromRequest(req);
    if (!auth) return fail("Unauthorized", 401);

    const body = (await readJson(req)) as { currentPassword?: string; newPassword?: string } | null;
    const currentPassword = body?.currentPassword ?? "";
    const newPassword = body?.newPassword ?? "";
    if (!currentPassword || newPassword.length < 8) {
        return fail("Current password and a new password (min 8 chars) are required");
    }

    const admin = await prisma.admin.findUnique({ where: { id: Number(auth.sub) } });
    if (!admin) return fail("Unauthorized", 401);

    if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) {
        return fail("Current password is incorrect", 401);
    }

    const now = new Date();
    await prisma.admin.update({
        where: { id: admin.id },
        data: { passwordHash: await bcrypt.hash(newPassword, 10), passwordChangedAt: now },
    });

    const token = await signAuthToken({
        sub: String(admin.id),
        role: admin.role === "teacher" ? "teacher" : "admin",
        email: admin.email ?? undefined,
        username: admin.username,
        teacherId: admin.teacherId ?? undefined,
    });
    const res = NextResponse.json({ ok: true });
    setAuthCookie(res, token);
    return res;
}
