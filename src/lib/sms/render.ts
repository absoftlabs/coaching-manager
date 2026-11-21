// Fills an SMS template's [placeholders]. Used by both preview and send so
// a preview always matches what guardians receive.

export type RenderSubject = {
    className: string;
    mcqTotal?: number;
    mcqGain?: number;
    quesTotal?: number;
    quesGain?: number;
    totalMarks?: number;
    totalGain?: number;
};

export type RenderContext = {
    coachingName?: string;
    student?: { name: string; studentId: string; roll?: string; batch?: string };
    result?: {
        resultType?: string;
        examDate?: string | null;
        totalMarks?: number;
        totalGain?: number;
        subjects?: RenderSubject[];
    };
};

export const SMS_PLACEHOLDERS: Array<{ key: string; label: string; example: string }> = [
    { key: "[coaching-name]", label: "Coaching Name", example: "Bright Future Coaching" },
    { key: "[student-name]", label: "Student Name", example: "Arif Hasan" },
    { key: "[student-id]", label: "Student ID", example: "PCC-01930" },
    { key: "[student-roll]", label: "Student Roll", example: "42" },
    { key: "[gain-mark/total-mark]", label: "Gain/Total Marks", example: "85/100" },
    { key: "[exam-type]", label: "Exam Type", example: "Weekly Test" },
    { key: "[exam-date]", label: "Exam Date", example: "2025-10-27" },
    { key: "[subject]", label: "Single Subject", example: "Physics" },
    { key: "[subjects]", label: "Multiple Subjects", example: "Physics-50/100, Chemistry-70/100" },
];

const str = (v: unknown) => (v == null ? "" : String(v));

function subjectTotals(s: RenderSubject) {
    const t = s.totalMarks ?? (s.mcqTotal ?? 0) + (s.quesTotal ?? 0);
    const g = s.totalGain ?? (s.mcqGain ?? 0) + (s.quesGain ?? 0);
    return { t, g };
}

export function renderTemplate(body: string, ctx: RenderContext): string {
    const subjects = ctx.result?.subjects ?? [];
    let gainTotal = "";
    if (ctx.result) {
        const total = ctx.result.totalMarks ?? subjects.reduce((a, s) => a + subjectTotals(s).t, 0);
        const gain = ctx.result.totalGain ?? subjects.reduce((a, s) => a + subjectTotals(s).g, 0);
        gainTotal = `${gain}/${total}`;
    }

    const examDate = ctx.result?.examDate ? str(ctx.result.examDate).slice(0, 10) : "";

    const values: Record<string, string> = {
        "[coaching-name]": str(ctx.coachingName),
        "[student-name]": str(ctx.student?.name),
        "[student-id]": str(ctx.student?.studentId),
        "[student-roll]": str(ctx.student?.roll),
        "[gain-mark/total-mark]": gainTotal,
        "[exam-type]": str(ctx.result?.resultType),
        "[exam-date]": examDate,
        "[subject]": subjects.length === 1 ? subjects[0].className : "",
        "[subjects]": subjects
            .map((s) => {
                const { t, g } = subjectTotals(s);
                return `${s.className}-${g}/${t}`;
            })
            .join(", "),
    };

    let out = body;
    for (const [key, value] of Object.entries(values)) out = out.replaceAll(key, value);
    return out.trim();
}
