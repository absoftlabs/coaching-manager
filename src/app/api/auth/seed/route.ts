// One-time setup endpoint that creates the first admin from DEMO_ADMIN_* env vars.
// Prefer `npm run seed:admin`. Disabled in production unless ALLOW_SEED_IN_PRODUCTION=true.
import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { fail, ok } from "@/lib/api";

function safeEqual(a: string, b: string) {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED_IN_PRODUCTION !== "true") {
        return fail("Not found", 404);
    }
    if (!rateLimit(`seed:${clientIp(req)}`, 10, 60_000)) return fail("Too many attempts. Try again shortly.", 429);

    const expected = process.env.SEED_SECRET || "";
    if (!expected || !safeEqual(req.headers.get("x-seed-secret") || "", expected)) return fail("Unauthorized", 401);

    const email = (process.env.DEMO_ADMIN_EMAIL || "").trim().toLowerCase();
    const password = process.env.DEMO_ADMIN_PASSWORD || "";
    const username = (process.env.DEMO_ADMIN_USERNAME || email).trim();
    if (!email || !password) return fail("Missing DEMO_ADMIN_EMAIL or DEMO_ADMIN_PASSWORD");

    if ((req.nextUrl.searchParams.get("mode") || "").toLowerCase() === "check") {
        const exists = await prisma.admin.findUnique({ where: { email } });
        return ok({ ok: true, email, exists: !!exists });
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.admin.upsert({
        where: { email },
        update: { username, passwordHash, role: "admin", passwordChangedAt: now },
        create: { email, username, passwordHash, role: "admin", passwordChangedAt: now },
    });
    return ok({ ok: true, email, mode: "upsert" });
}
