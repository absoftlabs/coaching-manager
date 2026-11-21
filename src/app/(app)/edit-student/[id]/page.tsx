import { StudentForm } from "@/components/students/student-form";
import { NotFoundCard } from "@/components/shared/misc";
import { getStudent, listBatchNames } from "@/lib/queries";

export const metadata = { title: "Edit Student" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const id = Number((await params).id);
    const [student, batches] = await Promise.all([Number.isInteger(id) ? getStudent(id) : null, listBatchNames()]);
    if (!student) return <NotFoundCard text="Student not found." />;
    return <StudentForm batches={batches} initial={student} />;
}
