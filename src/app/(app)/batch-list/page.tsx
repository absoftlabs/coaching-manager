import { BatchList } from "@/components/batches/batch-list";
import { listBatches } from "@/lib/queries";

export const metadata = { title: "Batches" };

export default async function Page() {
    return <BatchList rows={await listBatches()} />;
}
