import { StudentList } from "@/components/students/student-list";
import { listBatchNames, listStudents } from "@/lib/queries";

export const metadata = { title: "Suspended Students" };

export default async function Page() {
    const [rows, batches] = await Promise.all([listStudents({ suspended: true }), listBatchNames()]);
    return <StudentList rows={rows} batches={batches} suspendedOnly />;
}
