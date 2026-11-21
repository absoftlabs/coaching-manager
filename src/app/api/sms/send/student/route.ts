import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, ok, parseBody, prismaError } from "@/lib/api";
import { renderTemplate } from "@/lib/sms/render";
import { sendSms } from "@/lib/sms/bulksms";
import { getOrgInfo, getSmsConfig } from "@/lib/settings";

const schema = z.object({
    batch: z.string().trim().min(1, "Batch is required"),
    studentId: z.string().trim().optional(), // omit to send to the whole batch
    templateId: z.coerce.number().int().positive("Template is required"),
    resultId: z.coerce.number().int().positive("Result is required"),
});

/** Sends a result SMS (rendered from a template) to guardians of a batch or one student. */
export async function POST(req: Request) {
    const { data, error } = await parseBody(req, schema);
    if (error) return error;

    try {
        const [template, result, cfg, org] = await Promise.all([
            prisma.smsTemplate.findUnique({ where: { id: data.templateId } }),
            prisma.result.findUnique({ where: { id: data.resultId }, include: { subjects: true } }),
            getSmsConfig(),
            getOrgInfo(),
        ]);
        if (!template) return fail("Template not found", 404);
        if (!result) return fail("Result not found", 404);
        if (!cfg.apiKey || !cfg.senderId) return fail("SMS API key/Sender ID not configured. Set it in Settings.");

        const students = await prisma.student.findMany({
            where: {
                batch: { name: data.batch },
                isSuspended: false,
                ...(data.studentId ? { studentId: data.studentId } : {}),
            },
        });
        if (!students.length) return fail("No students found", 404);

        const resultCtx = {
            resultType: result.resultType,
            examDate: result.examDate?.toISOString() ?? null,
            totalMarks: result.totalMarks,
            totalGain: result.totalGain,
            subjects: result.subjects,
        };

        const items: Array<{ studentId: string; phone: string; status: string; error?: string }> = [];
        for (const s of students) {
            const phone = s.guardianPhone?.trim();
            if (!phone) {
                items.push({ studentId: s.studentId, phone: "", status: "skip-no-phone" });
                continue;
            }
            const message = renderTemplate(template.templateBody, {
                coachingName: org.name,
                student: { name: s.name, studentId: s.studentId, roll: s.roll, batch: data.batch },
                result: resultCtx,
            });
            const res = await sendSms({ to: phone, message, apiKey: cfg.apiKey, senderId: cfg.senderId, apiUrl: cfg.apiUrl });
            await prisma.smsLog.create({
                data: {
                    audience: "student",
                    batchName: data.batch,
                    studentId: s.studentId,
                    templateId: template.id,
                    preview: message,
                    phone,
                    status: res.ok ? "sent" : "failed",
                    providerId: res.responseCode ? String(res.responseCode) : "",
                    sentAt: new Date(),
                    error: res.errorMessage ?? "",
                },
            });
            items.push({ studentId: s.studentId, phone, status: res.ok ? "sent" : "failed", error: res.errorMessage });
        }

        const sent = items.filter((x) => x.status === "sent").length;
        return ok({ ok: sent === items.length, count: items.length, sent, failed: items.length - sent, items });
    } catch (e) {
        return prismaError(e, "POST /api/sms/send/student");
    }
}
