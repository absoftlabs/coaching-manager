import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, parseBody, prismaError } from "@/lib/api";
import { feeInclude, listFees, serializeFee } from "@/lib/queries";
import { feeSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
    try {
        return ok(await listFees(req.nextUrl.searchParams.get("q") || undefined));
    } catch (e) {
        return prismaError(e, "GET /api/fees");
    }
}

export async function POST(req: Request) {
    const { data, error } = await parseBody(req, feeSchema);
    if (error) return error;
    try {
        const student = await prisma.student.findUnique({ where: { studentId: data.studentId } });
        if (!student) return fail("Student not found", 404);
        const created = await prisma.fee.create({
            data: {
                studentRefId: student.id,
                studentName: data.studentName,
                amount: data.amount,
                depositBy: data.depositBy,
                receivedBy: data.receivedBy,
            },
            include: feeInclude,
        });
        return ok(serializeFee(created), 201);
    } catch (e) {
        return prismaError(e, "POST /api/fees");
    }
}
