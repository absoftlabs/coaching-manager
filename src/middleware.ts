import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

const PUBLIC_PAGES = new Set(["/login"]);
const PUBLIC_API_PREFIXES = ["/api/auth/login", "/api/auth/logout", "/api/auth/seed"];
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// A teacher account can only mark attendance and change its own password.
const TEACHER_PAGES = new Set(["/attendance", "/change-password"]);

function teacherMayCallApi(pathname: string, method: string) {
    if (pathname === "/api/attendance") return true;
    if (pathname === "/api/auth/me" || pathname === "/api/auth/change-password") return true;
    if ((pathname === "/api/batches" || pathname === "/api/students") && method === "GET") return true;
    return false;
}

/** CSRF defence: state-changing API calls must come from this site's own origin. */
function hasValidOrigin(req: NextRequest) {
    const origin = req.headers.get("origin");
    if (!origin) return true;
    try {
        return new URL(origin).host === req.headers.get("host");
    } catch {
        return false;
    }
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isApi = pathname.startsWith("/api/");

    if (isApi && UNSAFE_METHODS.has(req.method) && !hasValidOrigin(req)) {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const isPublic = PUBLIC_PAGES.has(pathname) || PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifyAuthToken(token) : null;

    if (pathname === "/login" && session) {
        return NextResponse.redirect(new URL(session.role === "teacher" ? "/attendance" : "/", req.url));
    }
    if (isPublic) return NextResponse.next();

    if (!session) {
        if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const res = NextResponse.redirect(new URL("/login", req.url));
        if (token) res.cookies.set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
        return res;
    }

    if (session.role === "teacher") {
        if (isApi && !teacherMayCallApi(pathname, req.method)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (!isApi && !TEACHER_PAGES.has(pathname)) {
            return NextResponse.redirect(new URL("/attendance", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)"],
};
