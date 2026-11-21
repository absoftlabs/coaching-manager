import { fail, ok, readJson } from "@/lib/api";
import { getSmsBalance } from "@/lib/sms/bulksms";
import { getSmsConfig } from "@/lib/settings";

/** POST /api/settings/check-sms { apiKey?, apiUrl? } — verifies a key and returns the balance.
 *  Falls back to the saved key/URL when none is given. */
export async function POST(req: Request) {
    const body = (await readJson(req)) as { apiKey?: string; apiUrl?: string } | null;
    const saved = await getSmsConfig();
    const apiKey = body?.apiKey?.trim() || saved.apiKey || "";
    const apiUrl = body?.apiUrl?.trim() || saved.apiUrl;
    if (!apiKey) return fail("API key required");

    const res = await getSmsBalance(apiKey, apiUrl);
    if (!res.ok) return fail(res.errorMessage || "Failed to check balance");
    return ok({ balance: res.balance });
}
