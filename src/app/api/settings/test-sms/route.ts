import { z } from "zod";
import { fail, ok, parseBody } from "@/lib/api";
import { getOrgInfo, getSmsConfig } from "@/lib/settings";
import { sendSms } from "@/lib/sms/bulksms";

const schema = z.object({ phone: z.string().trim().min(1, "Phone is required") });

/** POST /api/settings/test-sms — sends one test SMS with the saved settings. */
export async function POST(req: Request) {
    const { data, error } = await parseBody(req, schema);
    if (error) return error;

    const cfg = await getSmsConfig();
    if (!cfg.apiKey || !cfg.senderId) return fail("Save the SMS API key and Sender ID first.");

    const org = await getOrgInfo();
    const res = await sendSms({
        to: data.phone,
        message: `Test SMS from ${org.name}. Your SMS settings are working.`,
        apiKey: cfg.apiKey,
        senderId: cfg.senderId,
        apiUrl: cfg.apiUrl,
    });
    if (!res.ok) return fail(res.errorMessage || "SMS sending failed");
    return ok({ ok: true });
}
