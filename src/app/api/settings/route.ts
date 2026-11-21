import { z } from "zod";
import { ok, parseBody, prismaError } from "@/lib/api";
import { getAdminSettings, saveSettings } from "@/lib/settings";
import { optText } from "@/lib/validation";

// Admin only (middleware blocks teachers from every /api/settings route).
export async function GET() {
    try {
        return ok(await getAdminSettings());
    } catch (e) {
        return prismaError(e, "GET /api/settings");
    }
}

const schema = z.object({
    orgLogo: optText,
    orgName: optText,
    orgPhone: optText,
    orgAddress: optText,
    smsApiKey: optText,
    smsSenderId: optText,
    smsApiUrl: optText.refine((v) => !v || /^https?:\/\//i.test(v), "API URL must start with http:// or https://"),
});

/** PATCH /api/settings — only the keys present in the body are changed. */
export async function PATCH(req: Request) {
    const { data, error } = await parseBody(req, schema);
    if (error) return error;
    try {
        const update = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
        await saveSettings(update);
        return ok(await getAdminSettings());
    } catch (e) {
        return prismaError(e, "PATCH /api/settings");
    }
}
