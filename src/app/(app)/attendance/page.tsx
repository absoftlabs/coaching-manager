import { AttendanceBoard } from "@/components/attendance/attendance-board";
import { listBatchNames } from "@/lib/queries";

export const metadata = { title: "Attendance" };

export default async function Page() {
    return <AttendanceBoard batches={await listBatchNames()} />;
}
