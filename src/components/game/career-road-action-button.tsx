"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  decideCareerOpportunityAction,
  recordCareerMilestoneAction,
  saveCareerObjectiveAction,
  setAcademyWatchlistAction,
} from "@/app/(game)/game/career-road/actions";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

type ObjectivePayload = {
  type: "objective";
  key: string;
  titleKey: string;
  descriptionKey: string;
  progress: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
};

type OpportunityPayload = {
  type: "opportunity";
  teamId: string;
  categoryId: string;
  invitationScore: number;
  reasonKey: string;
  status: "WATCHLIST" | "ACCEPTED" | "DECLINED";
};

type ProspectPayload = {
  type: "prospect";
  driverId: string;
  fitScore: number;
  status: "WATCHLIST" | "ARCHIVED";
};

type MilestonePayload = {
  type: "milestone";
  key: string;
  titleKey: string;
  detailKey: string;
  progress: number;
  achieved: boolean;
};

type CareerRoadPayload = ObjectivePayload | OpportunityPayload | ProspectPayload | MilestonePayload;

interface CareerRoadActionButtonProps {
  payload: CareerRoadPayload;
  labelKey: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "premium";
  size?: "sm" | "default" | "lg";
  disabled?: boolean;
  className?: string;
}

export function CareerRoadActionButton({
  payload,
  labelKey,
  variant = "secondary",
  size = "sm",
  disabled = false,
  className,
}: CareerRoadActionButtonProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function runAction() {
    startTransition(async () => {
      const result =
        payload.type === "objective"
          ? await saveCareerObjectiveAction(payload)
          : payload.type === "opportunity"
            ? await decideCareerOpportunityAction(payload)
            : payload.type === "prospect"
              ? await setAcademyWatchlistAction(payload)
              : await recordCareerMilestoneAction(payload);

      if (!result.ok) {
        toast.error(result.message ?? t(result.messageKey));
        return;
      }

      toast.success(t(result.messageKey));
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={disabled || isPending}
      onClick={runAction}
      className={className}
    >
      {isPending ? t("careerRoad.actionSaving") : t(labelKey)}
    </Button>
  );
}
