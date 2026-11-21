import "server-only";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError, type ZodTypeAny, type z } from "zod";

export function ok<T>(data: T, status = 200) {
    return NextResponse.json(data, { status });
}

export function fail(error: string, status = 400) {
    return NextResponse.json({ error }, { status });
}

/** Parses a numeric route id; returns null when it isn't a positive integer. */
export function parseId(raw: string): number | null {
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n : null;
}

export async function readJson(req: Request): Promise<unknown> {
    return req.json().catch(() => null);
}

/** Validates a body with zod; returns either parsed data or a 400 response. */
export async function parseBody<S extends ZodTypeAny>(
    req: Request,
    schema: S
): Promise<{ data: z.infer<S>; error?: undefined } | { data?: undefined; error: NextResponse }> {
    const raw = await readJson(req);
    if (raw === null) return { error: fail("Invalid JSON") };
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return { error: fail(firstIssue(parsed.error)) };
    return { data: parsed.data };
}

function firstIssue(err: ZodError): string {
    const issue = err.issues[0];
    if (!issue) return "Invalid request";
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
}

/** Maps Prisma errors to proper HTTP responses; logs and returns 500 otherwise. */
export function prismaError(error: unknown, context: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") return fail("Not found", 404);
        if (error.code === "P2002") {
            const target = ((error.meta?.target as string[] | string | undefined) ?? "").toString();
            if (target.includes("roll")) return fail("This roll number is already used in the selected batch", 409);
            if (target.includes("code")) return fail("A class with this code already exists in the selected batch", 409);
            if (target.includes("email")) return fail("Email already in use", 409);
            if (target.includes("username")) return fail("Username already in use", 409);
            if (target.includes("name")) return fail("Name already exists", 409);
            return fail("A record with this value already exists", 409);
        }
        if (error.code === "P2003" || error.code === "P2014") {
            return fail("Cannot delete: still referenced by other records", 409);
        }
    }
    console.error(`${context}:`, error);
    return fail("Internal server error", 500);
}
