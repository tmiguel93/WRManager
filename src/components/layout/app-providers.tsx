"use client";

import type { PropsWithChildren } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <TooltipProvider>
      {children}
      <Toaster richColors theme="dark" closeButton />
    </TooltipProvider>
  );
}
