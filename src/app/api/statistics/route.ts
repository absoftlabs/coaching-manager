import { ok, prismaError } from "@/lib/api";
import { getDashboardStats } from "@/lib/stats";

export async function GET() {
    try {
        return ok(await getDashboardStats());
    } catch (e) {
        return prismaError(e, "GET /api/statistics");
    }
}
