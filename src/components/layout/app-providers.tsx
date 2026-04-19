"use client";

import type { PropsWithChildren } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/i18n/client";

interface AppProvidersProps extends PropsWithChildren {
  initialLocale: string;
}

export function AppProviders({ children, initialLocale }: AppProvidersProps) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <TooltipProvider>
        {children}
        <Toaster richColors theme="dark" closeButton />
      </TooltipProvider>
    </I18nProvider>
  );
}
