import { ClassForm } from "@/components/classes/class-form";
import { listBatchNames, listTeachers } from "@/lib/queries";

export const metadata = { title: "Add Class" };

export default async function Page() {
    const [batches, teachers] = await Promise.all([listBatchNames(), listTeachers({ suspended: false })]);
    return <ClassForm batches={batches} teachers={teachers.map((t) => t.name)} />;
}
