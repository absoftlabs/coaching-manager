import { NextRequest } from "next/server";
import { ok, prismaError } from "@/lib/api";
import { getAttendanceTrend } from "@/lib/stats";

/** GET /api/statistics/attendance-trend?days=14 */
export async function GET(req: NextRequest) {
    try {
        return ok(await getAttendanceTrend(Number(req.nextUrl.searchParams.get("days")) || 14));
    } catch (e) {
        return prismaError(e, "GET /api/statistics/attendance-trend");
    }
}
