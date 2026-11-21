import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAuthToken, setAuthCookie } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { fail, readJson } from "@/lib/api";

// Compared against when no account matches, so both failure paths take the same time.
const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8s34SNFqOhKQpjeTVnGvGtfJC4nOTC";

export async function POST(req: NextRequest) {
    try {
        if (!rateLimit(`login:${clientIp(req)}`, 10, 60_000)) {
            return fail("Too many attempts. Try again shortly.", 429);
        }

        const body = (await readJson(req)) as { identifier?: string; password?: string } | null;
        const identifier = (body?.identifier ?? "").trim();
        const password = body?.password ?? "";
        if (!identifier || !password) return fail("Identifier and password are required");

        const admin = await prisma.admin.findFirst({
            where: { OR: [{ email: identifier.toLowerCase() }, { email: identifier }, { username: identifier }] },
            include: { teacher: true },
        });

        const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
        if (!admin || !valid) return fail("Invalid credentials", 401);

        if (admin.role === "teacher" && admin.teacher?.isSuspended) {
            return fail("This account has been suspended", 403);
        }

        const role = admin.role === "teacher" ? "teacher" : "admin";
        const token = await signAuthToken({
            sub: String(admin.id),
            role,
            email: admin.email ?? undefined,
            username: admin.username,
            teacherId: admin.teacherId ?? undefined,
        });

        const res = NextResponse.json({ ok: true, user: { username: admin.username, role } });
        setAuthCookie(res, token);
        return res;
    } catch (error) {
        console.error("POST /api/auth/login error:", error);
        return fail("Login failed", 500);
    }
}
