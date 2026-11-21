import { ResultForm } from "@/components/results/result-form";
import { listBatchNames, listClasses } from "@/lib/queries";

export const metadata = { title: "Add Result" };

export default async function Page() {
    const [batches, classes] = await Promise.all([listBatchNames(), listClasses()]);
    return <ResultForm batches={batches} classes={classes} />;
}
