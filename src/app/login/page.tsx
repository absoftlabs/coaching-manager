"use client";

import { useState } from "react";
import { AlertCircle, CalendarCheck, Eye, EyeOff, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/misc";
import { useApp, useOrgLogo } from "@/components/providers";
import { readError } from "@/lib/utils";

const FEATURES = [
    { icon: Users, text: "Students, teachers & batches in one place" },
    { icon: CalendarCheck, text: "Attendance, fees & results — tracked daily" },
    { icon: MessageSquare, text: "Reach guardians instantly by SMS" },
];

export default function LoginPage() {
    const { org } = useApp();
    const logo = useOrgLogo();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password }),
            });
            if (!res.ok) {
                setError(await readError(res, "Login failed"));
                setLoading(false);
                return;
            }
            const j = (await res.json()) as { user?: { role?: string } };
            window.location.href = j.user?.role === "teacher" ? "/attendance" : "/";
        } catch {
            setError("Network error. Please try again.");
            setLoading(false);
        }
    }

    return (
        <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
            {/* Brand panel */}
            <div className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
                <div
                    aria-hidden
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
                        backgroundSize: "36px 36px",
                    }}
                />
                <div aria-hidden className="absolute -right-24 -bottom-24 size-96 rounded-full bg-chart-2/25 blur-3xl" />
                <div className="relative flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo} alt="" className="size-11 rounded-xl bg-white object-cover" />
                    <span className="text-lg font-extrabold">{org.name}</span>
                </div>
                <div className="relative space-y-8">
                    <h2 className="max-w-md text-4xl leading-[1.1] font-extrabold tracking-tight">
                        Run your coaching center from one place.
                    </h2>
                    <ul className="space-y-4">
                        {FEATURES.map(({ icon: Icon, text }) => (
                            <li key={text} className="flex items-center gap-3 text-sm text-sidebar-foreground/85">
                                <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-accent">
                                    <Icon className="size-4 text-chart-2" />
                                </span>
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="relative text-xs text-sidebar-muted">{org.address}</p>
            </div>

            {/* Form */}
            <div className="flex items-center justify-center px-5 py-10">
                <div className="w-full max-w-sm space-y-8">
                    <div className="flex flex-col items-center gap-3 text-center lg:hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logo} alt="" className="size-16 rounded-2xl object-cover shadow-md" />
                        <p className="font-extrabold">{org.name}</p>
                    </div>

                    <div className="space-y-1.5 text-center lg:text-left">
                        <h1 className="text-2xl font-extrabold tracking-tight">Sign in</h1>
                        <p className="text-sm text-muted-foreground">Admins and teachers sign in here.</p>
                    </div>

                    <form className="space-y-4" onSubmit={onSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="identifier">Email, username or phone</Label>
                            <Input
                                id="identifier"
                                className="h-11"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                autoComplete="username"
                                autoCapitalize="none"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={show ? "text" : "password"}
                                    className="h-11 pr-11"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShow((s) => !s)}
                                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                                    aria-label={show ? "Hide password" : "Show password"}
                                >
                                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle />
                                {error}
                            </Alert>
                        )}

                        <Button type="submit" size="lg" className="w-full" disabled={loading}>
                            {loading ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
