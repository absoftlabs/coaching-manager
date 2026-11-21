// JWT helpers. Edge-safe (used by middleware), so no Node-only imports here.
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest, NextResponse } from "next/server";

export const AUTH_COOKIE_NAME = "cms_token";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export type Role = "admin" | "teacher";

export type AuthPayload = {
    sub: string; // admins.id
    role: Role;
    email?: string;
    username: string;
    teacherId?: number;
};

function getSecretKey(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("Missing JWT_SECRET");
    return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: AuthPayload): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
        .sign(getSecretKey());
}

export async function verifyAuthToken(token: string): Promise<AuthPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecretKey());
        if (typeof payload.sub !== "string" || (payload.role !== "admin" && payload.role !== "teacher")) {
            return null;
        }
        return payload as unknown as AuthPayload;
    } catch {
        return null;
    }
}

const cookieBase = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
};

export function setAuthCookie(res: NextResponse, token: string) {
    res.cookies.set(AUTH_COOKIE_NAME, token, { ...cookieBase, maxAge: TOKEN_TTL_SECONDS });
}

export function clearAuthCookie(res: NextResponse) {
    res.cookies.set(AUTH_COOKIE_NAME, "", { ...cookieBase, maxAge: 0 });
}

export async function getAuthFromRequest(req: NextRequest): Promise<AuthPayload | null> {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    return token ? verifyAuthToken(token) : null;
}
