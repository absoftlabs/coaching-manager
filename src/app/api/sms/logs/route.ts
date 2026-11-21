import { NextRequest } from "next/server";
import { ok, prismaError } from "@/lib/api";
import { listSmsLogs } from "@/lib/queries";

/** GET /api/sms/logs?audience=student|teacher&batch= (latest 200) */
export async function GET(req: NextRequest) {
    const sp = req.nextUrl.searchParams;
    try {
        return ok(
            await listSmsLogs({
                audience: sp.get("audience") || undefined,
                batchName: sp.get("batch") || undefined,
            })
        );
    } catch (e) {
        return prismaError(e, "GET /api/sms/logs");
    }
}
