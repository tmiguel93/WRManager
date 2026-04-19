import { PremiumSkeleton } from "@/components/common/premium-skeleton";

export default function NewCareerLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-6 py-10 md:px-10">
      <PremiumSkeleton className="h-16 w-96" />
      <PremiumSkeleton className="h-24" />
      <PremiumSkeleton className="h-[560px]" />
    </div>
  );
}
