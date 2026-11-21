import { FeeList } from "@/components/fees/fee-list";
import { listFees } from "@/lib/queries";

export const metadata = { title: "Fees List" };

export default async function Page() {
    return <FeeList rows={await listFees()} />;
}
