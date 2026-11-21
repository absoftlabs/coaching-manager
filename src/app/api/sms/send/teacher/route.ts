import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, ok, parseBody, prismaError } from "@/lib/api";
import { sendSms } from "@/lib/sms/bulksms";
import { getSmsConfig } from "@/lib/settings";

const schema = z.object({
    scope: z.enum(["ALL", "INDIVIDUAL"]),
    teacherId: z.coerce.number().int().positive().optional(),
    message: z.string().trim().min(1, "Message required"),
});

/** Sends a custom SMS to all active teachers or one teacher. */
export async function POST(req: Request) {
    const { data, error } = await parseBody(req, schema);
    if (error) return error;
    if (data.scope === "INDIVIDUAL" && !data.teacherId) return fail("Select a teacher");

    try {
        const teachers = await prisma.teacher.findMany({
            where: { isSuspended: false, ...(data.scope === "INDIVIDUAL" ? { id: data.teacherId } : {}) },
        });
        if (!teachers.length) return fail("No teachers found", 404);

        const cfg = await getSmsConfig();
        if (!cfg.apiKey || !cfg.senderId) return fail("SMS API key/Sender ID not configured. Set it in Settings.");

        const items: Array<{ teacher: string; phone: string; status: string; error?: string }> = [];
        for (const t of teachers) {
            const phone = t.phone?.trim();
            if (!phone) {
                items.push({ teacher: t.name, phone: "", status: "skip-no-phone" });
                continue;
            }
            const res = await sendSms({ to: phone, message: data.message, apiKey: cfg.apiKey, senderId: cfg.senderId, apiUrl: cfg.apiUrl });
            await prisma.smsLog.create({
                data: {
                    audience: "teacher",
                    teacherId: t.teacherCode ?? t.name,
                    preview: data.message,
                    phone,
                    status: res.ok ? "sent" : "failed",
                    providerId: res.responseCode ? String(res.responseCode) : "",
                    sentAt: new Date(),
                    error: res.errorMessage ?? "",
                },
            });
            items.push({ teacher: t.name, phone, status: res.ok ? "sent" : "failed", error: res.errorMessage });
        }

        const sent = items.filter((x) => x.status === "sent").length;
        return ok({ ok: sent === items.length, count: items.length, sent, failed: items.length - sent, items });
    } catch (e) {
        return prismaError(e, "POST /api/sms/send/teacher");
    }
}
