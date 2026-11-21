import { TeacherSms } from "@/components/sms/teacher-sms";
import { listTeachers } from "@/lib/queries";
import { getSmsConfig } from "@/lib/settings";

export const metadata = { title: "SMS Teachers" };

export default async function Page() {
    const [teachers, cfg] = await Promise.all([listTeachers({ suspended: false }), getSmsConfig()]);
    return <TeacherSms teachers={teachers} smsReady={!!(cfg.apiKey && cfg.senderId)} />;
}
