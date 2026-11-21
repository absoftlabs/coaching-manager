import { FeeForm } from "@/components/fees/collect-fee-form";
import { NotFoundCard } from "@/components/shared/misc";
import { getFee } from "@/lib/queries";

export const metadata = { title: "Edit Fee" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const id = Number((await params).id);
    const fee = Number.isInteger(id) ? await getFee(id) : null;
    if (!fee) return <NotFoundCard text="Fee record not found." />;
    return <FeeForm initial={fee} />;
}
