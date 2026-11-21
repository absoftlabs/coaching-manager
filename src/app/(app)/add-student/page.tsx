import { StudentForm } from "@/components/students/student-form";
import { listBatchNames } from "@/lib/queries";

export const metadata = { title: "Add Student" };

export default async function Page() {
    return <StudentForm batches={await listBatchNames()} />;
}
