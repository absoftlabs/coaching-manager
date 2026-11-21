import { StudentSms } from "@/components/sms/student-sms";
import { listBatchNames, listTemplates } from "@/lib/queries";
import { getSmsConfig } from "@/lib/settings";

export const metadata = { title: "SMS Students" };

export default async function Page() {
    const [batches, templates, cfg] = await Promise.all([listBatchNames(), listTemplates(), getSmsConfig()]);
    return <StudentSms batches={batches} templates={templates} smsReady={!!(cfg.apiKey && cfg.senderId)} />;
}
