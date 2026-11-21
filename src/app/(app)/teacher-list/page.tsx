import { TeacherList } from "@/components/teachers/teacher-list";
import { listTeachers } from "@/lib/queries";

export const metadata = { title: "Teacher List" };

export default async function Page() {
    return <TeacherList rows={await listTeachers({ suspended: false })} />;
}
