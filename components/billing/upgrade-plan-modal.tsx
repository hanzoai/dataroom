import { useEffect, useRef } from "react";
import React from "react";

import { useTeam } from "@/context/team-context";
import { PAY_URL, visit } from "@/lib/billing/hosted";
import { PlanEnum } from "@/lib/billing/legacy/constants";

import { useAnalytics } from "@/lib/analytics";

/**
 * Opens the hosted pricing page in a new tab. Either wrap a trigger element as
 * `children`, or drive it by flipping `open` to true.
 *
 * `clickedPlan` rides the analytics event so we still know which gate the
 * visitor hit. `highlightItem` has no effect: the hosted page owns the plan
 * catalog and how it is presented.
 */
export function UpgradePlanModal({
  clickedPlan,
  trigger,
  open,
  setOpen,
  highlightItem,
  children,
}: {
  clickedPlan: PlanEnum;
  trigger?: string;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  highlightItem?: string[];
  children?: React.ReactNode;
}) {
  const teamId = useTeam()?.currentTeam?.id;
  const analytics = useAnalytics();
  const sent = useRef(false);

  const upgrade = () => {
    analytics.capture("Upgrade Button Clicked", {
      trigger,
      plan: clickedPlan,
      teamId,
    });
    visit(PAY_URL);
  };

  useEffect(() => {
    if (!open) {
      sent.current = false;
      return;
    }
    if (sent.current) return;
    sent.current = true;
    upgrade();
    setOpen?.(false);
  }, [open]);

  return React.isValidElement<{
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  }>(children) ? (
    React.cloneElement(children, { onClick: upgrade })
  ) : (
    <>{children}</>
  );
}
