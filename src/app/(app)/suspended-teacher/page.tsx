import { TeacherList } from "@/components/teachers/teacher-list";
import { listTeachers } from "@/lib/queries";

export const metadata = { title: "Suspended Teachers" };

export default async function Page() {
    return <TeacherList rows={await listTeachers({ suspended: true })} suspendedOnly />;
}
