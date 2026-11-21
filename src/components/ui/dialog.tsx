"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
                "fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
                className
            )}
            {...props}
        />
    );
}

/** Bottom sheet on phones, centred dialog from `sm` up. */
function DialogContent({
    className,
    children,
    showClose = true,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { showClose?: boolean }) {
    return (
        <DialogPrimitive.Portal>
            <DialogOverlay />
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={cn(
                    "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] w-full flex-col gap-4 overflow-y-auto rounded-t-2xl border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl duration-200 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom",
                    "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[88dvh] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:p-6 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=closed]:zoom-out-95",
                    className
                )}
                {...props}
            >
                <div className="mx-auto -mt-1 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/25 sm:hidden" />
                {children}
                {showClose && (
                    <DialogPrimitive.Close className="absolute top-4 right-4 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                        <XIcon className="size-4" />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
    );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("flex flex-col gap-1.5 pr-6 text-left", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return <DialogPrimitive.Title className={cn("text-lg leading-tight font-bold", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return <DialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
