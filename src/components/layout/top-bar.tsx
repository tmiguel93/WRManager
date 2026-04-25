"use client";

import { useTransition } from "react";
import { CalendarClock, Coins, Flag, Layers2 } from "lucide-react";
import Link from "next/link";
import { Menu, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { AnimatedNumber } from "@/components/motion/animated-number";
import { LanguageSelector } from "@/components/common/language-selector";
import { TeamLogoMark } from "@/components/common/team-logo-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PRIMARY_NAV } from "@/config/navigation";
import { formatDate } from "@/lib/format";
import { quickAutoSaveAction } from "@/app/(game)/game/save-center/actions";
import { useI18n } from "@/i18n/client";

interface TopBarProps {
  teamName: string;
  teamLogoUrl: string | null;
  categoryCode: string;
  cashBalance: number;
  currentDateIso: string;
  careerName: string;
  seasonPhase: "PRESEASON" | "ROUND_ACTIVE" | "MID_SEASON" | "SEASON_END" | "OFFSEASON";
}

export function TopBar({
  teamName,
  teamLogoUrl,
  categoryCode,
  cashBalance,
  currentDateIso,
  careerName,
  seasonPhase,
}: TopBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  function handleQuickSave() {
    startTransition(async () => {
      const result = await quickAutoSaveAction();
      if (!result.ok) {
        toast.error(t("topbar.quickSaveError", result.message));
        return;
      }
      toast.success(t("topbar.quickSaveSuccess", result.message));
      router.refresh();
    });
  }

  const seasonLabelByPhase: Record<TopBarProps["seasonPhase"], string> = {
    PRESEASON: t("season.preSeason"),
    ROUND_ACTIVE: t("season.roundActive"),
    MID_SEASON: t("season.midSeason"),
    SEASON_END: t("season.seasonEnd"),
    OFFSEASON: t("season.offSeason"),
  };

  return (
    <header
      className="sticky top-0 z-30 border-b border-white/10 bg-[#04070f]/80 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(95deg, color-mix(in oklab, var(--team-primary) 14%, transparent) 0%, color-mix(in oklab, var(--team-secondary) 9%, transparent) 42%, color-mix(in oklab, var(--team-accent) 13%, transparent) 100%)",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1680px] items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <TeamLogoMark name={teamName} logoUrl={teamLogoUrl} className="h-9 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{teamName}</p>
              <p className="truncate text-xs text-muted-foreground">{careerName}</p>
            </div>
          </div>
        </div>

        <Sheet>
          <SheetTrigger
            render={<Button variant="ghost" size="icon-sm" className="border border-white/10 lg:hidden" />}
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="border-white/15 bg-[#04070f]">
            <SheetHeader>
              <SheetTitle className="font-heading text-white">{t("topbar.navigation", "Navigation")}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-2">
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl border border-white/10 px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
                >
                  {t(item.labelKey, item.labelKey)}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="sm"
            className="border border-white/15 bg-white/5 text-xs"
            onClick={handleQuickSave}
            disabled={isPending}
          >
            <Save className="mr-1 size-3.5" />
            {t("common.save")}
          </Button>
          <LanguageSelector />
          <Badge className="team-outline team-accent-text rounded-full border bg-white/10">
            <Flag className="mr-1 size-3" />
            {categoryCode}
          </Badge>
          <Badge className="rounded-full border border-white/15 bg-white/5 text-white">
            <CalendarClock className="mr-1 size-3" />
            {formatDate(currentDateIso)}
          </Badge>
          <Badge className="rounded-full border border-emerald-300/35 bg-emerald-500/10 text-emerald-100">
            <Coins className="mr-1 size-3" />$
            <AnimatedNumber value={cashBalance} />
          </Badge>
          <Badge className="rounded-full border border-violet-300/30 bg-violet-500/10 text-violet-100">
            <Layers2 className="mr-1 size-3" />
            {seasonLabelByPhase[seasonPhase]}
          </Badge>
        </div>
      </div>
    </header>
  );
}
