import { z } from "zod";
import { DAYS, RESULT_TYPES } from "@/lib/types";

/** Optional text: trims, and turns "" into null. */
export const optText = z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (typeof v === "string" ? v.trim() || null : v));

/** Optional number: accepts numbers or numeric strings, "" → null. */
export const optNumber = z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((v, ctx) => {
        if (v === undefined) return undefined;
        if (v === null || v === "") return null;
        const n = Number(v);
        if (!Number.isFinite(n)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be a number" });
            return z.NEVER;
        }
        return n;
    });

export const studentSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    batch: z.string().trim().min(1, "Batch is required"),
    roll: z.string().trim().min(1, "Roll is required"),
    division: optText,
    schoolName: optText,
    schoolRoll: optText,
    schoolSection: optText,
    address: optText,
    fatherName: optText,
    motherName: optText,
    guardianName: optText,
    guardianPhone: optText,
    gender: optText,
    photoUrl: optText,
    birthDate: optText,
    courseFee: optNumber,
    isSuspended: z.boolean().optional(),
});

export const teacherSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    phone: z.string().trim().min(1, "Phone is required"),
    primarySubject: z.string().trim().min(1, "Primary subject is required"),
    imageUrl: optText,
    joinDate: optText,
    salary: optNumber,
    isSuspended: z.boolean().optional(),
});

export const classSchema = z.object({
    name: z.string().trim().min(1, "Class name is required"),
    code: z.string().trim().min(1, "Class code is required"),
    teacher: z.string().trim().optional().default(""),
    batch: z.string().trim().optional().default(""),
    days: z.array(z.enum(DAYS)).optional().default([]),
    isActive: z.boolean().optional().default(true),
});

export const feeSchema = z.object({
    studentId: z.string().trim().min(1, "Student is required"),
    studentName: z.string().trim().min(1, "Student name is required"),
    amount: z.coerce.number().positive("Enter a valid amount"),
    depositBy: z.string().trim().min(1, "Deposit by is required"),
    receivedBy: z.string().trim().min(1, "Received by is required"),
});

export const subjectSchema = z.object({
    className: z.string().trim().min(1, "Subject is required"),
    mcqTotal: z.coerce.number().min(0).default(0),
    mcqGain: z.coerce.number().min(0).default(0),
    quesTotal: z.coerce.number().min(0).default(0),
    quesGain: z.coerce.number().min(0).default(0),
});

export const resultSchema = z.object({
    batch: z.string().trim().min(1, "Batch is required"),
    studentId: z.string().trim().min(1, "Student is required"),
    studentName: z.string().trim().min(1, "Student name is required"),
    resultType: z.enum(RESULT_TYPES),
    examDate: optText,
    subjects: z.array(subjectSchema).min(1, "Add at least one subject"),
});

export function withTotals(subjects: z.infer<typeof subjectSchema>[]) {
    const rows = subjects.map((s) => ({
        ...s,
        totalMarks: s.mcqTotal + s.quesTotal,
        totalGain: s.mcqGain + s.quesGain,
    }));
    return {
        rows,
        totalMarks: rows.reduce((a, s) => a + s.totalMarks, 0),
        totalGain: rows.reduce((a, s) => a + s.totalGain, 0),
    };
}

export function toExamDate(v: string | null | undefined): Date | null {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
}
