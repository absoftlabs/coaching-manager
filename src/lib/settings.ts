import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SMS_API_URL } from "@/lib/sms/bulksms";

export const DEFAULT_ORG = {
    name: "Prottasha Coaching Center",
    phone: "01798930232",
    address: "Cheradanghi Mor, Auliapur, Sadar, Dinajpur",
};

/** Public, non-secret organisation info (safe to send to any page, incl. login). */
export type OrgInfo = {
    name: string;
    phone: string;
    address: string;
    logo: string | null;
};

export type SmsConfig = {
    apiKey: string | null;
    senderId: string | null;
    apiUrl: string;
};

const SETTINGS_ID = 1;

async function readRow() {
    return prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
}

export async function getOrgInfo(): Promise<OrgInfo> {
    try {
        const row = await readRow();
        return {
            name: row?.orgName || DEFAULT_ORG.name,
            phone: row?.orgPhone || DEFAULT_ORG.phone,
            address: row?.orgAddress || DEFAULT_ORG.address,
            logo: row?.orgLogo || null,
        };
    } catch {
        return { ...DEFAULT_ORG, logo: null };
    }
}

export async function getSmsConfig(): Promise<SmsConfig> {
    const row = await readRow();
    return {
        apiKey: row?.smsApiKey || process.env.SMS_API_KEY || null,
        senderId: row?.smsSenderId || process.env.SMS_SENDER_ID || null,
        apiUrl: row?.smsApiUrl || DEFAULT_SMS_API_URL,
    };
}

export type SettingsUpdate = Partial<{
    orgLogo: string | null;
    orgName: string | null;
    orgPhone: string | null;
    orgAddress: string | null;
    smsApiKey: string | null;
    smsSenderId: string | null;
    smsApiUrl: string | null;
}>;

export async function saveSettings(data: SettingsUpdate) {
    return prisma.settings.upsert({
        where: { id: SETTINGS_ID },
        update: data,
        create: { id: SETTINGS_ID, ...data },
    });
}

/** Everything the Settings page edits (admin only — includes the SMS API key). */
export async function getAdminSettings() {
    const row = await readRow();
    return {
        orgLogo: row?.orgLogo ?? null,
        orgName: row?.orgName ?? "",
        orgPhone: row?.orgPhone ?? "",
        orgAddress: row?.orgAddress ?? "",
        smsApiKey: row?.smsApiKey ?? "",
        smsSenderId: row?.smsSenderId ?? "",
        smsApiUrl: row?.smsApiUrl ?? "",
    };
}

export type AdminSettings = Awaited<ReturnType<typeof getAdminSettings>>;
