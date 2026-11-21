import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ok, parseBody, prismaError } from "@/lib/api";
import type { AdminDTO } from "@/lib/types";

function serialize(a: { id: number; email: string | null; username: string; createdAt: Date }): AdminDTO {
    return { id: a.id, email: a.email, username: a.username, createdAt: a.createdAt.toISOString() };
}

/** GET /api/admins — admin-role accounts only (not teacher logins). */
export async function GET() {
    try {
        const admins = await prisma.admin.findMany({ where: { role: "admin" }, orderBy: { createdAt: "asc" } });
        return ok(admins.map(serialize));
    } catch (e) {
        return prismaError(e, "GET /api/admins");
    }
}

const schema = z.object({
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    username: z.string().trim().min(1, "Username is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
    const { data, error } = await parseBody(req, schema);
    if (error) return error;
    try {
        const created = await prisma.admin.create({
            data: {
                email: data.email,
                username: data.username,
                passwordHash: await bcrypt.hash(data.password, 10),
                role: "admin",
            },
        });
        return ok(serialize(created), 201);
    } catch (e) {
        return prismaError(e, "POST /api/admins");
    }
}
