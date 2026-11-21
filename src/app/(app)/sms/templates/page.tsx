import { TemplatesManager } from "@/components/sms/templates-manager";
import { listTemplates } from "@/lib/queries";
import { getOrgInfo } from "@/lib/settings";

export const metadata = { title: "SMS Templates" };

export default async function Page() {
    const [templates, org] = await Promise.all([listTemplates(), getOrgInfo()]);
    return <TemplatesManager initial={templates} orgName={org.name} />;
}
