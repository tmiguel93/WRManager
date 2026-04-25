"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setLocalePreferenceAction } from "@/app/(game)/game/settings/actions";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/client";
import { localeLabel, SUPPORTED_LOCALES, type AppLocale } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  className?: string;
  showBadge?: boolean;
}

export function LanguageSelector({ className, showBadge = true }: LanguageSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t, locale, setLocale } = useI18n();

  function handleLocaleChange(nextLocale: string) {
    const normalized = nextLocale as AppLocale;
    startTransition(async () => {
      setLocale(normalized);
      const result = await setLocalePreferenceAction({ locale: normalized });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(t("language.updated", result.message));
      router.refresh();
    });
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showBadge ? (
        <Badge className="rounded-full border border-white/15 bg-white/5 text-white">
          <Languages className="mr-1 size-3" />
          {t("language.badge")}: {localeLabel(locale)}
        </Badge>
      ) : null}
      <select
        value={locale}
        onChange={(event) => handleLocaleChange(event.target.value)}
        disabled={isPending}
        className="h-9 rounded-full border border-white/20 bg-[#070b16] px-3 text-xs text-foreground shadow-sm outline-none transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-70"
        aria-label={t("language.title")}
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {localeLabel(code)}
          </option>
        ))}
      </select>
    </div>
  );
}
