import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const auth = await getAuthFromRequest(req);
    if (!auth) return NextResponse.json({ ok: false }, { status: 401 });
    return NextResponse.json({ ok: true, user: { username: auth.username, role: auth.role, email: auth.email } });
}
