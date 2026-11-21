import { ClassForm } from "@/components/classes/class-form";
import { NotFoundCard } from "@/components/shared/misc";
import { getClass, listBatchNames, listTeachers } from "@/lib/queries";

export const metadata = { title: "Edit Class" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const id = Number((await params).id);
    const [item, batches, teachers] = await Promise.all([
        Number.isInteger(id) ? getClass(id) : null,
        listBatchNames(),
        listTeachers({ suspended: false }),
    ]);
    if (!item) return <NotFoundCard text="Class not found." />;
    return <ClassForm batches={batches} teachers={teachers.map((t) => t.name)} initial={item} />;
}
