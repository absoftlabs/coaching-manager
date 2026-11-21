"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/form";
import { readError } from "@/lib/utils";

export default function ChangePasswordPage() {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (next !== confirmPw) return toast.error("New passwords don't match");
        setLoading(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: current, newPassword: next }),
            });
            if (!res.ok) return toast.error(await readError(res, "Failed to change password"));
            toast.success("Password updated");
            setCurrent("");
            setNext("");
            setConfirmPw("");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="mx-auto max-w-md">
            <CardHeader className="flex-row items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <KeyRound className="size-5" />
                </span>
                <div className="space-y-1">
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Use at least 8 characters.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={onSubmit}>
                    <Field label="Current Password" htmlFor="current" required>
                        <Input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
                    </Field>
                    <Field label="New Password" htmlFor="next" required>
                        <Input id="next" type="password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required />
                    </Field>
                    <Field label="Confirm New Password" htmlFor="confirm" required>
                        <Input id="confirm" type="password" minLength={8} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" required />
                    </Field>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Updating..." : "Update Password"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
