"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, MessageSquareCode, Plus, ShieldCheck, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, ImagePicker } from "@/components/shared/form";
import { useConfirm } from "@/components/shared/confirm";
import { useApp } from "@/components/providers";
import type { AdminDTO } from "@/lib/types";
import { readError } from "@/lib/utils";

type Settings = {
    orgLogo: string | null;
    orgName: string;
    orgPhone: string;
    orgAddress: string;
    smsApiKey: string;
    smsSenderId: string;
    smsApiUrl: string;
};

const DEFAULT_API_URL = "http://bulksmsbd.net/api";

async function patchSettings(body: Partial<Settings>) {
    return fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

function SectionTitle({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
    return (
        <CardHeader className="flex-row items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
            </span>
            <div className="space-y-1">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </div>
        </CardHeader>
    );
}

function OrgCard({ initial }: { initial: Settings }) {
    const router = useRouter();
    const [logo, setLogo] = useState(initial.orgLogo ?? "");
    const [name, setName] = useState(initial.orgName);
    const [phone, setPhone] = useState(initial.orgPhone);
    const [address, setAddress] = useState(initial.orgAddress);
    const [saving, setSaving] = useState(false);

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const res = await patchSettings({ orgLogo: logo || null, orgName: name, orgPhone: phone, orgAddress: address });
        setSaving(false);
        if (res.ok) {
            toast.success("Organisation info saved");
            router.refresh();
        } else toast.error(await readError(res, "Failed to save"));
    }

    return (
        <Card>
            <SectionTitle icon={Building2} title="Coaching Info" description="Shown in the app, on the login page and on printed receipts, mark sheets & profiles." />
            <CardContent>
                <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <ImagePicker label="Logo" value={logo} onChange={setLogo} maxSize={256} />
                    </div>
                    <Field label="Coaching Name" htmlFor="orgName" className="sm:col-span-2">
                        <Input id="orgName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Prottasha Coaching Center" />
                    </Field>
                    <Field label="Phone" htmlFor="orgPhone">
                        <Input id="orgPhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
                    </Field>
                    <Field label="Address" htmlFor="orgAddress">
                        <Textarea id="orgAddress" rows={1} className="min-h-10" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </Field>
                    <div className="flex justify-end sm:col-span-2">
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save Coaching Info"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

function SmsCard({ initial }: { initial: Settings }) {
    const [apiUrl, setApiUrl] = useState(initial.smsApiUrl);
    const [apiKey, setApiKey] = useState(initial.smsApiKey);
    const [senderId, setSenderId] = useState(initial.smsSenderId);
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [checking, setChecking] = useState(false);
    const [balance, setBalance] = useState<string | null>(null);
    const [testOpen, setTestOpen] = useState(false);
    const [testPhone, setTestPhone] = useState("");
    const [testing, setTesting] = useState(false);
    const configured = !!(initial.smsApiKey && initial.smsSenderId);

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const res = await patchSettings({ smsApiUrl: apiUrl, smsApiKey: apiKey, smsSenderId: senderId });
        setSaving(false);
        if (res.ok) toast.success("SMS settings saved");
        else toast.error(await readError(res, "Failed to save SMS settings"));
    }

    async function checkBalance() {
        if (!apiKey.trim()) return toast.error("Enter an API key first");
        setChecking(true);
        try {
            const res = await fetch("/api/settings/check-sms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey: apiKey.trim(), apiUrl: apiUrl.trim() || undefined }),
            });
            if (res.ok) {
                const j = (await res.json()) as { balance: string };
                setBalance(j.balance);
                toast.success(`API key works. Balance: ৳ ${j.balance}`);
            } else {
                setBalance(null);
                toast.error(await readError(res, "Failed to check balance"));
            }
        } finally {
            setChecking(false);
        }
    }

    async function sendTest(e: React.FormEvent) {
        e.preventDefault();
        setTesting(true);
        const res = await fetch("/api/settings/test-sms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: testPhone }),
        });
        setTesting(false);
        if (res.ok) {
            toast.success("Test SMS sent");
            setTestOpen(false);
        } else toast.error(await readError(res, "Test SMS failed"));
    }

    return (
        <Card>
            <SectionTitle
                icon={MessageSquareCode}
                title="SMS API"
                description="Gateway used to send result SMS to guardians and messages to teachers (BulkSMSBD-compatible API)."
            />
            <CardContent>
                <form onSubmit={save} className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={configured ? "success" : "warning"}>{configured ? "Configured" : "Not configured"}</Badge>
                        {balance !== null && (
                            <Badge variant="secondary">
                                <Wallet /> Balance ৳ {balance}
                            </Badge>
                        )}
                    </div>
                    <Field label="API Base URL" htmlFor="apiUrl" hint={`Leave empty to use the default: ${DEFAULT_API_URL}`}>
                        <Input id="apiUrl" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder={DEFAULT_API_URL} autoComplete="off" inputMode="url" />
                    </Field>
                    <Field label="API Key" htmlFor="apiKey">
                        <div className="relative">
                            <Input
                                id="apiKey"
                                type={showKey ? "text" : "password"}
                                className="pr-11 font-mono"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Your API key"
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey((s) => !s)}
                                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                                aria-label={showKey ? "Hide key" : "Show key"}
                            >
                                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                    </Field>
                    <Field label="Sender ID" htmlFor="senderId" hint="Approved sender ID / masking name from your SMS provider.">
                        <Input id="senderId" value={senderId} onChange={(e) => setSenderId(e.target.value)} placeholder="e.g. 8809617XXXXXX" autoComplete="off" />
                    </Field>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => setTestOpen(true)} disabled={!configured}>
                            Send Test SMS
                        </Button>
                        <Button type="button" variant="outline" onClick={checkBalance} disabled={checking}>
                            {checking ? "Checking..." : "Check Balance"}
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save SMS Settings"}
                        </Button>
                    </div>
                </form>
            </CardContent>

            <Dialog open={testOpen} onOpenChange={setTestOpen}>
                <DialogContent>
                    <form onSubmit={sendTest} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>Send a test SMS</DialogTitle>
                            <DialogDescription>Uses the saved settings. Save first if you changed anything.</DialogDescription>
                        </DialogHeader>
                        <Field label="Phone number" htmlFor="testPhone" required>
                            <Input id="testPhone" type="tel" inputMode="tel" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="01XXXXXXXXX" required />
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setTestOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={testing}>
                                {testing ? "Sending..." : "Send"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

function AdminsCard({ initial }: { initial: AdminDTO[] }) {
    const { user } = useApp();
    const confirm = useConfirm();
    const [admins, setAdmins] = useState(initial);
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [adding, setAdding] = useState(false);

    async function add(e: React.FormEvent) {
        e.preventDefault();
        setAdding(true);
        const res = await fetch("/api/admins", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, username, password }),
        });
        setAdding(false);
        if (!res.ok) return toast.error(await readError(res, "Failed to add admin"));
        const created = (await res.json()) as AdminDTO;
        setAdmins((prev) => [...prev, created]);
        setOpen(false);
        setEmail("");
        setUsername("");
        setPassword("");
        toast.success("Admin added");
    }

    async function remove(a: AdminDTO) {
        const ok = await confirm({ title: `Remove ${a.username}?`, description: "They will no longer be able to log in.", confirmText: "Remove", destructive: true });
        if (!ok) return;
        const res = await fetch(`/api/admins/${a.id}`, { method: "DELETE" });
        if (res.ok) {
            setAdmins((prev) => prev.filter((x) => x.id !== a.id));
            toast.success("Admin removed");
        } else toast.error(await readError(res, "Failed to remove admin"));
    }

    return (
        <Card>
            <SectionTitle icon={ShieldCheck} title="Admin Accounts" description="Accounts with full access to the admin panel. Teacher logins are managed from the Teacher List." />
            <CardContent className="space-y-3">
                <ul className="divide-y overflow-hidden rounded-xl border">
                    {admins.map((a) => {
                        const isMe = a.username === user?.username;
                        return (
                            <li key={a.id} className="flex items-center gap-3 px-3 py-2.5">
                                <Avatar name={a.username} className="size-9" />
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-semibold">
                                        {a.username} {isMe && <Badge variant="secondary" className="ml-1">You</Badge>}
                                    </div>
                                    <div className="truncate text-xs text-muted-foreground">{a.email || "-"}</div>
                                </div>
                                <Button size="icon-sm" variant="ghost" className="text-destructive" disabled={isMe} onClick={() => remove(a)} aria-label="Remove admin" title={isMe ? "You can't remove your own account" : "Remove"}>
                                    <Trash2 />
                                </Button>
                            </li>
                        );
                    })}
                </ul>
                <Button variant="outline" className="w-full border-dashed" onClick={() => setOpen(true)}>
                    <Plus /> Add Admin
                </Button>
            </CardContent>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <form onSubmit={add} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>Add admin</DialogTitle>
                            <DialogDescription>They&apos;ll get full access to the admin panel.</DialogDescription>
                        </DialogHeader>
                        <Field label="Email" htmlFor="newEmail" required>
                            <Input id="newEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </Field>
                        <Field label="Username" htmlFor="newUsername" required>
                            <Input id="newUsername" value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" required />
                        </Field>
                        <Field label="Password" htmlFor="newPassword" required hint="At least 8 characters.">
                            <Input id="newPassword" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={adding}>
                                {adding ? "Adding..." : "Add Admin"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

export function SettingsView({ settings, admins }: { settings: Settings; admins: AdminDTO[] }) {
    return (
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="space-y-5">
                <OrgCard initial={settings} />
                <AdminsCard initial={admins} />
            </div>
            <div>
                <SmsCard initial={settings} />
            </div>
        </div>
    );
}
