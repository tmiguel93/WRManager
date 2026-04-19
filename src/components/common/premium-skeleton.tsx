import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PremiumSkeletonProps {
  className?: string;
}

export function PremiumSkeleton({ className }: PremiumSkeletonProps) {
  return (
    <Skeleton
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 before:absolute before:inset-0 before:animate-pulse before:bg-gradient-to-r before:from-transparent before:via-cyan-300/10 before:to-transparent",
        className,
      )}
    />
  );
}
