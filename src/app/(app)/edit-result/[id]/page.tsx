import { ResultForm } from "@/components/results/result-form";
import { NotFoundCard } from "@/components/shared/misc";
import { getResult, listBatchNames, listClasses } from "@/lib/queries";

export const metadata = { title: "Edit Result" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const id = Number((await params).id);
    const [result, batches, classes] = await Promise.all([
        Number.isInteger(id) ? getResult(id) : null,
        listBatchNames(),
        listClasses(),
    ]);
    if (!result) return <NotFoundCard text="Result not found." />;
    return <ResultForm batches={batches} classes={classes} initial={result} />;
}
