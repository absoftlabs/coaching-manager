import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, parseBody, prismaError } from "@/lib/api";
import { listTemplates, serializeTemplate } from "@/lib/queries";

const templateSchema = z.object({
    templateName: z.string().trim().min(1, "Template name is required"),
    templateBody: z.string().trim().min(1, "Template body is required"),
});

export async function GET(req: NextRequest) {
    try {
        return ok(await listTemplates(req.nextUrl.searchParams.get("q") || undefined));
    } catch (e) {
        return prismaError(e, "GET /api/sms/templates");
    }
}

export async function POST(req: Request) {
    const { data, error } = await parseBody(req, templateSchema);
    if (error) return error;
    try {
        return ok(serializeTemplate(await prisma.smsTemplate.create({ data })), 201);
    } catch (e) {
        return prismaError(e, "POST /api/sms/templates");
    }
}
