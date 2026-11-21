// Server-side data access + serializers shared by API routes and server pages.
import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
    AttendanceDTO,
    AttendanceStatus,
    BatchDTO,
    ClassDTO,
    FeeDTO,
    ResultDTO,
    SmsLogDTO,
    SmsTemplateDTO,
    StudentDTO,
    TeacherDTO,
} from "@/lib/types";

const iso = (d: Date) => d.toISOString();

/* ---------------- Batches ---------------- */

export async function resolveBatchId(name: string): Promise<number> {
    const batch = await prisma.batch.upsert({ where: { name }, update: {}, create: { name } });
    return batch.id;
}

export async function listBatches(): Promise<BatchDTO[]> {
    const rows = await prisma.batch.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { classes: true, students: { where: { isSuspended: false } } } } },
    });
    return rows.map((b) => ({ id: b.id, name: b.name, totalClass: b._count.classes, totalStudent: b._count.students }));
}

export async function listBatchNames(): Promise<string[]> {
    const rows = await prisma.batch.findMany({ orderBy: { name: "asc" }, select: { name: true } });
    return rows.map((r) => r.name);
}

/* ---------------- Students ---------------- */

type StudentRow = Prisma.StudentGetPayload<{ include: { batch: true } }>;

export function serializeStudent(s: StudentRow): StudentDTO {
    return {
        id: s.id,
        studentId: s.studentId,
        name: s.name,
        batch: s.batch.name,
        roll: s.roll,
        division: s.division,
        schoolName: s.schoolName,
        schoolRoll: s.schoolRoll,
        schoolSection: s.schoolSection,
        address: s.address,
        fatherName: s.fatherName,
        motherName: s.motherName,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        gender: s.gender,
        photoUrl: s.photoUrl,
        isSuspended: s.isSuspended,
        birthDate: s.birthDate,
        courseFee: s.courseFee,
        createdAt: iso(s.createdAt),
    };
}

export async function listStudents(filter: {
    q?: string;
    batch?: string;
    roll?: string;
    suspended?: boolean;
    take?: number;
} = {}): Promise<StudentDTO[]> {
    const where: Prisma.StudentWhereInput = {};
    const q = filter.q?.trim();
    if (q) {
        where.OR = [
            { name: { contains: q } },
            { studentId: { contains: q } },
            { batch: { name: { contains: q } } },
            { roll: { contains: q } },
            { guardianName: { contains: q } },
            { guardianPhone: { contains: q } },
        ];
    }
    if (filter.batch) where.batch = { name: filter.batch };
    if (filter.roll) where.roll = filter.roll;
    if (filter.suspended !== undefined) where.isSuspended = filter.suspended;

    const rows = await prisma.student.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { batch: true },
        take: filter.take,
    });
    return rows.map(serializeStudent);
}

export async function getStudent(id: number): Promise<StudentDTO | null> {
    const s = await prisma.student.findUnique({ where: { id }, include: { batch: true } });
    return s ? serializeStudent(s) : null;
}

/* ---------------- Teachers ---------------- */

type TeacherRow = Prisma.TeacherGetPayload<{ include: { account: { select: { username: true } } } }>;

function serializeTeacher(t: TeacherRow, classCounts: Map<string, number>): TeacherDTO {
    return {
        id: t.id,
        teacherCode: t.teacherCode,
        name: t.name,
        phone: t.phone,
        imageUrl: t.imageUrl,
        primarySubject: t.primarySubject,
        joinDate: t.joinDate,
        salary: t.salary,
        isSuspended: t.isSuspended,
        createdAt: iso(t.createdAt),
        totalAssignedClass: classCounts.get(t.name) ?? 0,
        username: t.account?.username ?? null,
    };
}

/** Classes store the teacher by name, so assigned-class counts group by name. */
async function classCountsByTeacher(): Promise<Map<string, number>> {
    const grouped = await prisma.classSession.groupBy({ by: ["teacher"], _count: { _all: true } });
    return new Map(grouped.filter((g) => g.teacher).map((g) => [g.teacher as string, g._count._all]));
}

export async function listTeachers(filter: { q?: string; suspended?: boolean } = {}): Promise<TeacherDTO[]> {
    const where: Prisma.TeacherWhereInput = {};
    if (filter.suspended !== undefined) where.isSuspended = filter.suspended;
    const q = filter.q?.trim();
    if (q) {
        where.OR = [
            { name: { contains: q } },
            { primarySubject: { contains: q } },
            { teacherCode: { contains: q } },
            { phone: { contains: q } },
        ];
    }
    const [rows, counts] = await Promise.all([
        prisma.teacher.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: { account: { select: { username: true } } },
        }),
        classCountsByTeacher(),
    ]);
    return rows.map((t) => serializeTeacher(t, counts));
}

export async function getTeacher(id: number): Promise<TeacherDTO | null> {
    const t = await prisma.teacher.findUnique({ where: { id }, include: { account: { select: { username: true } } } });
    if (!t) return null;
    return serializeTeacher(t, await classCountsByTeacher());
}

/* ---------------- Classes ---------------- */

type ClassRow = Prisma.ClassSessionGetPayload<{ include: { batch: true } }>;

export function serializeClass(c: ClassRow): ClassDTO {
    return {
        id: c.id,
        name: c.name,
        code: c.code,
        teacher: c.teacher ?? "",
        batch: c.batch?.name ?? "",
        days: Array.isArray(c.days) ? c.days.map(String) : [],
        isActive: c.isActive,
    };
}

export async function listClasses(filter: { q?: string; batch?: string } = {}): Promise<ClassDTO[]> {
    const where: Prisma.ClassSessionWhereInput = {};
    const q = filter.q?.trim();
    if (q) {
        where.OR = [
            { name: { contains: q } },
            { code: { contains: q } },
            { teacher: { contains: q } },
            { batch: { name: { contains: q } } },
        ];
    }
    if (filter.batch) where.batch = { name: filter.batch };
    const rows = await prisma.classSession.findMany({ where, include: { batch: true }, orderBy: { createdAt: "desc" } });
    return rows.map(serializeClass);
}

export async function getClass(id: number): Promise<ClassDTO | null> {
    const c = await prisma.classSession.findUnique({ where: { id }, include: { batch: true } });
    return c ? serializeClass(c) : null;
}

/* ---------------- Fees ---------------- */

type FeeRow = Prisma.FeeGetPayload<{ include: { student: { select: { studentId: true } } } }>;
export const feeInclude = { student: { select: { studentId: true } } } as const;

export function serializeFee(f: FeeRow): FeeDTO {
    return {
        id: f.id,
        studentId: f.student.studentId,
        studentName: f.studentName,
        amount: f.amount,
        depositBy: f.depositBy,
        receivedBy: f.receivedBy,
        createdAt: iso(f.createdAt),
    };
}

export async function listFees(q?: string): Promise<FeeDTO[]> {
    const query = q?.trim();
    const where: Prisma.FeeWhereInput = query
        ? {
              OR: [
                  { studentName: { contains: query } },
                  { student: { studentId: { contains: query } } },
                  { depositBy: { contains: query } },
              ],
          }
        : {};
    const rows = await prisma.fee.findMany({ where, orderBy: { createdAt: "desc" }, include: feeInclude });
    return rows.map(serializeFee);
}

export async function getFee(id: number): Promise<FeeDTO | null> {
    const f = await prisma.fee.findUnique({ where: { id }, include: feeInclude });
    return f ? serializeFee(f) : null;
}

/* ---------------- Results ---------------- */

export const resultInclude = {
    batch: true,
    subjects: { orderBy: { id: "asc" } },
    student: { select: { studentId: true } },
} as const satisfies Prisma.ResultInclude;

type ResultRow = Prisma.ResultGetPayload<{ include: typeof resultInclude }>;

export function serializeResult(r: ResultRow): ResultDTO {
    return {
        id: r.id,
        batch: r.batch.name,
        studentId: r.student.studentId,
        studentName: r.studentName,
        resultType: r.resultType,
        examDate: r.examDate ? iso(r.examDate) : null,
        totalMarks: r.totalMarks,
        totalGain: r.totalGain,
        subjects: r.subjects.map(({ className, mcqTotal, mcqGain, quesTotal, quesGain, totalMarks, totalGain }) => ({
            className,
            mcqTotal,
            mcqGain,
            quesTotal,
            quesGain,
            totalMarks,
            totalGain,
        })),
        createdAt: iso(r.createdAt),
    };
}

export async function listResults(filter: {
    q?: string;
    batch?: string;
    studentId?: string;
    resultType?: string;
    take?: number;
} = {}): Promise<ResultDTO[]> {
    const where: Prisma.ResultWhereInput = {};
    const q = filter.q?.trim();
    if (q) {
        where.OR = [
            { student: { studentId: { contains: q } } },
            { studentName: { contains: q } },
            { batch: { name: { contains: q } } },
        ];
    }
    if (filter.batch) where.batch = { name: filter.batch };
    if (filter.studentId) where.student = { studentId: filter.studentId };
    if (filter.resultType) where.resultType = filter.resultType;
    const rows = await prisma.result.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: resultInclude,
        take: filter.take,
    });
    return rows.map(serializeResult);
}

export async function getResult(id: number): Promise<ResultDTO | null> {
    const r = await prisma.result.findUnique({ where: { id }, include: resultInclude });
    return r ? serializeResult(r) : null;
}

/* ---------------- Attendance ---------------- */

export async function listAttendance(filter: {
    date: string;
    status?: AttendanceStatus;
    batch?: string;
    q?: string;
}): Promise<AttendanceDTO[]> {
    const where: Prisma.AttendanceWhereInput = { date: filter.date };
    if (filter.status) where.status = filter.status;
    if (filter.batch) where.batch = { name: filter.batch };
    const q = filter.q?.trim();
    if (q) {
        where.OR = [
            { student: { studentId: { contains: q } } },
            { studentName: { contains: q } },
            { batch: { name: { contains: q } } },
        ];
    }
    const rows = await prisma.attendance.findMany({
        where,
        orderBy: { studentName: "asc" },
        include: { batch: true, student: { select: { studentId: true } } },
    });
    return rows.map((a) => ({
        id: a.id,
        date: a.date,
        studentId: a.student.studentId,
        studentName: a.studentName,
        batch: a.batch.name,
        status: a.status === "Absent" ? "Absent" : "Present",
    }));
}

/* ---------------- SMS ---------------- */

export function serializeTemplate(t: {
    id: number;
    templateName: string;
    templateBody: string;
    updatedAt: Date;
}): SmsTemplateDTO {
    return { id: t.id, templateName: t.templateName, templateBody: t.templateBody, updatedAt: iso(t.updatedAt) };
}

export async function listTemplates(q?: string): Promise<SmsTemplateDTO[]> {
    const query = q?.trim();
    const rows = await prisma.smsTemplate.findMany({
        where: query ? { OR: [{ templateName: { contains: query } }, { templateBody: { contains: query } }] } : {},
        orderBy: { updatedAt: "desc" },
    });
    return rows.map(serializeTemplate);
}

export async function listSmsLogs(filter: { audience?: string; batchName?: string }): Promise<SmsLogDTO[]> {
    const where: Prisma.SmsLogWhereInput = {};
    if (filter.audience) where.audience = filter.audience;
    if (filter.batchName) where.batchName = filter.batchName;
    const rows = await prisma.smsLog.findMany({ where, orderBy: { sentAt: "desc" }, take: 200 });
    return rows.map((l) => ({
        id: l.id,
        audience: l.audience,
        batchName: l.batchName,
        studentId: l.studentId,
        teacherId: l.teacherId,
        preview: l.preview,
        phone: l.phone,
        status: l.status,
        sentAt: iso(l.sentAt),
        error: l.error,
    }));
}
