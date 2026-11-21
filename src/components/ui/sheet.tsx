"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTitle = SheetPrimitive.Title;
const SheetClose = SheetPrimitive.Close;

function SheetContent({
    className,
    children,
    side = "left",
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: "left" | "right" }) {
    return (
        <SheetPrimitive.Portal>
            <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
            <SheetPrimitive.Content
                className={cn(
                    "fixed inset-y-0 z-50 flex h-full w-[82%] max-w-xs flex-col shadow-2xl transition ease-in-out data-[state=open]:animate-in data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=closed]:duration-200",
                    side === "left"
                        ? "left-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left"
                        : "right-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
                    className
                )}
                {...props}
            >
                {children}
                <SheetPrimitive.Close className="absolute top-4 right-3 rounded-md p-1.5 opacity-70 hover:opacity-100 focus-visible:outline-none">
                    <XIcon className="size-5" />
                    <span className="sr-only">Close</span>
                </SheetPrimitive.Close>
            </SheetPrimitive.Content>
        </SheetPrimitive.Portal>
    );
}

export { Sheet, SheetContent, SheetTitle, SheetClose };
