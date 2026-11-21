// Client for the BulkSMSBD HTTP API (https://bulksmsbd.net).
// API key, sender ID and base URL all come from Admin → Settings.

export const DEFAULT_SMS_API_URL = "http://bulksmsbd.net/api";

export type SmsSendResult = {
    ok: boolean;
    responseCode?: number;
    errorMessage?: string;
};

const ERROR_MESSAGES: Record<number, string> = {
    1001: "Invalid Number",
    1002: "Sender ID not correct or disabled",
    1003: "Please fill all required fields",
    1005: "Internal Error",
    1006: "Balance Validity Not Available",
    1007: "Insufficient Balance",
    1011: "User ID not found",
    1012: "Masking SMS must be sent in Bengali",
    1013: "Sender ID has no gateway for this API key",
    1014: "Sender type name not found for this sender by API key",
    1015: "Sender ID has no valid gateway by API key",
    1016: "Sender type active price info not found for this sender ID",
    1017: "Sender type price info not found for this sender ID",
    1018: "This account owner is disabled",
    1019: "This account's sender type price is disabled",
    1020: "Parent of this account was not found",
    1021: "Parent's active sender type price was not found",
    1031: "Account not verified — contact administrator",
    1032: "IP not whitelisted",
};

/** 01XXXXXXXXX / 8801XXXXXXXXX / +8801XXXXXXXXX → 8801XXXXXXXXX */
export function normalizeBdPhone(input: string): string | null {
    const raw = (input || "").replace(/[^\d]/g, "");
    if (raw.length === 13 && raw.startsWith("8801")) return raw;
    if (raw.length === 11 && raw.startsWith("01")) return "88" + raw;
    return null;
}

function baseUrl(apiUrl?: string | null) {
    return (apiUrl || DEFAULT_SMS_API_URL).replace(/\/+$/, "");
}

export async function sendSms(opts: {
    to: string;
    message: string;
    apiKey: string;
    senderId: string;
    apiUrl?: string | null;
}): Promise<SmsSendResult> {
    try {
        if (!opts.apiKey) return { ok: false, errorMessage: "SMS API key is not configured. Add it in Settings." };
        if (!opts.senderId) return { ok: false, errorMessage: "SMS Sender ID is not configured. Add it in Settings." };

        const number = normalizeBdPhone(opts.to);
        if (!number) return { ok: false, errorMessage: "Invalid phone number" };

        const params = new URLSearchParams({
            api_key: opts.apiKey,
            type: "text",
            number,
            senderid: opts.senderId,
            message: opts.message,
        });

        const res = await fetch(`${baseUrl(opts.apiUrl)}/smsapi?${params.toString()}`, { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as
            | { response_code: number; success_message?: string; error_message?: string }
            | null;

        if (!data) return { ok: false, errorMessage: `HTTP ${res.status}` };
        if (data.response_code === 202) return { ok: true, responseCode: 202 };

        return {
            ok: false,
            responseCode: data.response_code,
            errorMessage: data.error_message || ERROR_MESSAGES[data.response_code] || "SMS sending failed",
        };
    } catch (e: unknown) {
        return { ok: false, errorMessage: e instanceof Error ? e.message : "Network error" };
    }
}

export async function getSmsBalance(
    apiKey: string,
    apiUrl?: string | null
): Promise<{ ok: boolean; balance?: string; errorMessage?: string }> {
    try {
        if (!apiKey) return { ok: false, errorMessage: "SMS API key is not configured." };
        const params = new URLSearchParams({ api_key: apiKey });
        const res = await fetch(`${baseUrl(apiUrl)}/getBalanceApi?${params.toString()}`, { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as
            | { response_code: number; balance?: string | number; error_message?: string }
            | null;

        if (!data) return { ok: false, errorMessage: `HTTP ${res.status}` };
        if (data.response_code in ERROR_MESSAGES) {
            return { ok: false, errorMessage: data.error_message || ERROR_MESSAGES[data.response_code] };
        }
        return { ok: true, balance: String(data.balance ?? "0") };
    } catch (e: unknown) {
        return { ok: false, errorMessage: e instanceof Error ? e.message : "Network error" };
    }
}
