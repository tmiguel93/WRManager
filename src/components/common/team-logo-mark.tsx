import Image from "next/image";

import { getEntityPlaceholderSvg, resolveAssetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

interface TeamLogoMarkProps {
  name: string;
  logoUrl?: string | null;
  className?: string;
  priority?: boolean;
}

export function TeamLogoMark({ name, logoUrl, className, priority = false }: TeamLogoMarkProps) {
  const placeholder = getEntityPlaceholderSvg("TEAM", name);
  const finalSrc = resolveAssetUrl(logoUrl, placeholder);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/15 bg-black/25",
        className,
      )}
    >
      <div className="absolute inset-0 team-gradient opacity-25" />
      <Image
        src={finalSrc}
        alt={`${name} logo`}
        fill
        priority={priority}
        className="relative z-10 object-contain p-1.5"
        sizes="96px"
      />
    </div>
  );
}
