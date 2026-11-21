"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Credentials } from "@/lib/types";

export function CredentialsDialog({
    credentials,
    title,
    description,
    onClose,
}: {
    credentials: Credentials | null;
    title: string;
    description: string;
    onClose: () => void;
}) {
    function copy() {
        if (!credentials) return;
        navigator.clipboard
            .writeText(`Username: ${credentials.username}\nPassword: ${credentials.password}`)
            .then(() => toast.success("Copied to clipboard"))
            .catch(() => toast.error("Copy failed"));
    }

    return (
        <Dialog open={!!credentials} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label>Username</Label>
                        <Input readOnly value={credentials?.username ?? ""} className="font-mono" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Password</Label>
                        <Input readOnly value={credentials?.password ?? ""} className="font-mono" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={copy}>
                        <Copy /> Copy
                    </Button>
                    <Button onClick={onClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
