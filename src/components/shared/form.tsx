"use client";

import { useRef, type ReactNode } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function Field({
    label,
    htmlFor,
    required,
    hint,
    className,
    children,
}: {
    label: string;
    htmlFor?: string;
    required?: boolean;
    hint?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn("space-y-2", className)}>
            <Label htmlFor={htmlFor}>
                {label}
                {required && <span className="text-destructive">*</span>}
            </Label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

/** A titled group of fields inside a form card. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-sm font-extrabold tracking-wide text-primary uppercase">{title}</h2>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
        </section>
    );
}

const NONE = "__none__";

/** Select with string options; supports an optional "none" entry mapped to "". */
export function SimpleSelect({
    id,
    value,
    onChange,
    options,
    placeholder = "Select",
    allowNone,
    noneLabel = "None",
    disabled,
    className,
}: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    options: Array<string | { value: string; label: string }>;
    placeholder?: string;
    allowNone?: boolean;
    noneLabel?: string;
    disabled?: boolean;
    className?: string;
}) {
    const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
    return (
        <Select
            value={value === "" ? (allowNone ? NONE : undefined) : value}
            onValueChange={(v) => onChange(v === NONE ? "" : v)}
            disabled={disabled}
        >
            <SelectTrigger id={id} className={className}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {allowNone && <SelectItem value={NONE}>{noneLabel}</SelectItem>}
                {opts.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                        {o.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

/** Downscales an image file to a JPEG data URL (keeps DB rows small). */
async function fileToDataUrl(file: File, maxSize: number): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.85);
}

export function ImagePicker({
    value,
    onChange,
    label = "Photo",
    maxSize = 400,
}: {
    value: string;
    onChange: (dataUrl: string) => void;
    label?: string;
    maxSize?: number;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please choose an image file");
            return;
        }
        try {
            onChange(await fileToDataUrl(file, maxSize));
        } catch {
            toast.error("Could not read this image");
        }
    }

    return (
        <div className="flex items-center gap-4">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-input bg-muted/50 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
                {value ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={value} alt="" className="size-full object-cover" />
                ) : (
                    <ImagePlus className="size-6" />
                )}
            </button>
            <div className="space-y-1.5">
                <div className="text-[13px] font-semibold">{label}</div>
                <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                        {value ? "Change" : "Upload"}
                    </Button>
                    {value && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>
                            <X /> Remove
                        </Button>
                    )}
                </div>
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
    );
}

/** Sticky-on-mobile footer bar for form submit buttons. */
export function FormActions({ children }: { children: ReactNode }) {
    return (
        <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 -mx-4 flex justify-end gap-2 border-t bg-card/95 px-4 pt-4 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none lg:bottom-0">
            {children}
        </div>
    );
}
