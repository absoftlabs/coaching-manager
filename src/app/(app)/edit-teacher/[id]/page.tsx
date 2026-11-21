import { TeacherForm } from "@/components/teachers/teacher-form";
import { NotFoundCard } from "@/components/shared/misc";
import { getTeacher } from "@/lib/queries";

export const metadata = { title: "Edit Teacher" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const id = Number((await params).id);
    const teacher = Number.isInteger(id) ? await getTeacher(id) : null;
    if (!teacher) return <NotFoundCard text="Teacher not found." />;
    return <TeacherForm initial={teacher} />;
}
