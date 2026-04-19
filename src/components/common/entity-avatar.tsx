import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CountryFlag } from "@/components/common/country-flag";
import { getEntityInitials, getEntityPlaceholderSvg } from "@/lib/assets";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/domain/models/core";

interface EntityAvatarProps {
  entityType: EntityType;
  name: string;
  countryCode: string;
  imageUrl?: string | null;
  className?: string;
}

export function EntityAvatar({
  entityType,
  name,
  countryCode,
  imageUrl,
  className,
}: EntityAvatarProps) {
  const fallbackSvg = getEntityPlaceholderSvg(entityType, name);

  return (
    <div className={cn("relative inline-flex", className)}>
      <Avatar className="size-12 border border-white/15">
        <AvatarImage src={imageUrl ?? fallbackSvg} alt={name} />
        <AvatarFallback className="bg-muted/70 text-xs font-semibold">
          {getEntityInitials(name)}
        </AvatarFallback>
      </Avatar>
      <CountryFlag
        countryCode={countryCode}
        className="absolute -bottom-1 -right-1 h-4 w-6 border border-background"
        title={countryCode}
      />
    </div>
  );
}
