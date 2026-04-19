import { PremiumSkeleton } from "@/components/common/premium-skeleton";

export default function GameLoading() {
  return (
    <div className="space-y-4">
      <PremiumSkeleton className="h-12 w-64" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <PremiumSkeleton key={index} className="h-32" />
        ))}
      </div>
      <PremiumSkeleton className="h-72" />
    </div>
  );
}
