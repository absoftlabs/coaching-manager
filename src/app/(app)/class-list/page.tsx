import { ClassList } from "@/components/classes/class-list";
import { listClasses } from "@/lib/queries";

export const metadata = { title: "Class List" };

export default async function Page() {
    return <ClassList rows={await listClasses()} />;
}
