import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
    return (
        <div className="space-y-4">
            <div className="flex gap-3">
                <Skeleton className="h-10 w-full max-w-xs" />
                <Skeleton className="ml-auto h-10 w-32" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
            ))}
        </div>
    );
}
