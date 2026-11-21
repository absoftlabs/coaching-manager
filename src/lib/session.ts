import "server-only";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyAuthToken, type AuthPayload } from "@/lib/auth";

/** Reads the logged-in user from the auth cookie inside server components. */
export async function getSession(): Promise<AuthPayload | null> {
    const store = await cookies();
    const token = store.get(AUTH_COOKIE_NAME)?.value;
    return token ? verifyAuthToken(token) : null;
}
