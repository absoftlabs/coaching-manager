// Shapes sent from server to client (API responses and server-component props).

export const DIVISIONS = ["Science", "Humanities", "Commerce"] as const;
export const SECTIONS = ["A", "B", "C", "D"] as const;
export const GENDERS = ["Male", "Female"] as const;
export const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export const RESULT_TYPES = ["Class Test", "Weekly Test", "Quiz Test", "Model Test", "Custom"] as const;
export type ResultType = (typeof RESULT_TYPES)[number];
export type AttendanceStatus = "Present" | "Absent";

export type StudentDTO = {
    id: number;
    studentId: string;
    name: string;
    batch: string;
    roll: string;
    division: string | null;
    schoolName: string | null;
    schoolRoll: string | null;
    schoolSection: string | null;
    address: string | null;
    fatherName: string | null;
    motherName: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    gender: string | null;
    photoUrl: string | null;
    isSuspended: boolean;
    birthDate: string | null;
    courseFee: number | null;
    createdAt: string;
};

export type TeacherDTO = {
    id: number;
    teacherCode: string | null;
    name: string;
    phone: string | null;
    imageUrl: string | null;
    primarySubject: string | null;
    joinDate: string | null;
    salary: number | null;
    isSuspended: boolean;
    createdAt: string;
    totalAssignedClass: number;
    username: string | null;
};

export type BatchDTO = { id: number; name: string; totalClass: number; totalStudent: number };

export type ClassDTO = {
    id: number;
    name: string;
    code: string;
    teacher: string;
    batch: string;
    days: string[];
    isActive: boolean;
};

export type FeeDTO = {
    id: number;
    studentId: string;
    studentName: string;
    amount: number;
    depositBy: string;
    receivedBy: string;
    createdAt: string;
};

export type SubjectMark = {
    className: string;
    mcqTotal: number;
    mcqGain: number;
    quesTotal: number;
    quesGain: number;
    totalMarks: number;
    totalGain: number;
};

export type ResultDTO = {
    id: number;
    batch: string;
    studentId: string;
    studentName: string;
    resultType: string;
    examDate: string | null;
    totalMarks: number;
    totalGain: number;
    subjects: SubjectMark[];
    createdAt: string;
};

export type AttendanceDTO = {
    id: number;
    date: string;
    studentId: string;
    studentName: string;
    batch: string;
    status: AttendanceStatus;
};

export type SmsTemplateDTO = {
    id: number;
    templateName: string;
    templateBody: string;
    updatedAt: string;
};

export type SmsLogDTO = {
    id: number;
    audience: string;
    batchName: string | null;
    studentId: string | null;
    teacherId: string | null;
    preview: string;
    phone: string;
    status: string;
    sentAt: string;
    error: string | null;
};

export type AdminDTO = { id: number; email: string | null; username: string; createdAt: string };

export type Credentials = { username: string; password: string };
