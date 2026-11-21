import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, parseBody } from "@/lib/api";
import { renderTemplate, type RenderContext } from "@/lib/sms/render";
import { getOrgInfo } from "@/lib/settings";

const schema = z.object({
    template: z.string().trim().min(1, "Template is required"),
    studentId: z.string().optional(),
    resultId: z.coerce.number().int().positive().optional(),
});

/** POST /api/sms/render — preview using the same renderer as the send routes. */
export async function POST(req: Request) {
    const { data, error } = await parseBody(req, schema);
    if (error) return error;

    const ctx: RenderContext = { coachingName: (await getOrgInfo()).name };

    if (data.studentId) {
        const s = await prisma.student.findUnique({ where: { studentId: data.studentId }, include: { batch: true } });
        if (s) ctx.student = { name: s.name, studentId: s.studentId, roll: s.roll, batch: s.batch.name };
    }
    if (data.resultId) {
        const r = await prisma.result.findUnique({ where: { id: data.resultId }, include: { subjects: true } });
        if (r) {
            ctx.result = {
                resultType: r.resultType,
                examDate: r.examDate?.toISOString() ?? null,
                totalMarks: r.totalMarks,
                totalGain: r.totalGain,
                subjects: r.subjects,
            };
        }
    }
    return ok({ preview: renderTemplate(data.template, ctx) });
}
