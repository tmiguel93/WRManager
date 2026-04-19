import * as FlagIcons from "country-flag-icons/react/3x2";

import { countryCodeToRegionEmoji, normalizeCountryCode } from "@/lib/country";
import { cn } from "@/lib/utils";

interface CountryFlagProps {
  countryCode: string | null | undefined;
  className?: string;
  title?: string;
}

export function CountryFlag({ countryCode, className, title }: CountryFlagProps) {
  const normalized = normalizeCountryCode(countryCode);
  const SvgFlag = FlagIcons[normalized as keyof typeof FlagIcons];

  if (SvgFlag) {
    return (
      <span className={cn("inline-flex overflow-hidden rounded-sm shadow-sm", className)} title={title}>
        <SvgFlag className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-sm bg-muted px-1 text-xs",
        className,
      )}
      title={title}
    >
      {countryCodeToRegionEmoji(normalized)}
    </span>
  );
}
