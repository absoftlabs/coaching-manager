import { ResultList } from "@/components/results/result-list";
import { listBatchNames, listClasses, listResults, listTemplates } from "@/lib/queries";

export const metadata = { title: "Result List" };

export default async function Page() {
    const [rows, batches, classes, templates] = await Promise.all([
        listResults(),
        listBatchNames(),
        listClasses(),
        listTemplates(),
    ]);
    return (
        <ResultList
            rows={rows}
            batches={batches}
            classes={Array.from(new Set(classes.map((c) => c.name)))}
            templates={templates}
        />
    );
}
