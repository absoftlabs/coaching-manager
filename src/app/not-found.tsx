import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="text-6xl font-extrabold text-primary">404</div>
            <p className="text-muted-foreground">This page doesn&apos;t exist.</p>
            <Link href="/" className={buttonVariants()}>
                Go to Dashboard
            </Link>
        </div>
    );
}
