import { StudentList } from "@/components/students/student-list";
import { listBatchNames, listStudents } from "@/lib/queries";

export const metadata = { title: "Student List" };

export default async function Page() {
    const [rows, batches] = await Promise.all([listStudents({ suspended: false }), listBatchNames()]);
    return <StudentList rows={rows} batches={batches} />;
}
