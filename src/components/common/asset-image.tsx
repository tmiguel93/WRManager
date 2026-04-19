import Image from "next/image";

import { getEntityPlaceholderSvg, resolveAssetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/domain/models/core";

interface AssetImageProps {
  entityType: EntityType;
  name: string;
  src?: string | null;
  alt?: string;
  className?: string;
  priority?: boolean;
}

export function AssetImage({
  entityType,
  name,
  src,
  alt,
  className,
  priority = false,
}: AssetImageProps) {
  const placeholder = getEntityPlaceholderSvg(entityType, name);
  const finalSrc = resolveAssetUrl(src, placeholder);

  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-white/10", className)}>
      <Image
        src={finalSrc}
        alt={alt ?? `${name} visual`}
        fill
        className="object-cover"
        priority={priority}
        sizes="(max-width: 768px) 100vw, 40vw"
      />
    </div>
  );
}
