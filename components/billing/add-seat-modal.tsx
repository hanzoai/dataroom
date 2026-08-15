import { useEffect, useRef } from "react";
import React from "react";

import { useTeam } from "@/context/team-context";
import { BILLING_URL, visit } from "@/lib/billing/hosted";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";

/**
 * Opens the hosted billing page in a new tab, where seats are added to the
 * subscription. Either wrap a trigger element as `children`, or drive it by
 * flipping `open` to true.
 */
export function AddSeatModal({
  open,
  setOpen,
  children,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children?: React.ReactNode;
}) {
  const teamId = useTeam()?.currentTeam?.id;
  const { plan } = usePlan();
  const analytics = useAnalytics();
  const sent = useRef(false);

  const addSeat = () => {
    analytics.capture("Add Seat Clicked", { teamId, plan });
    visit(BILLING_URL);
  };

  useEffect(() => {
    if (!open) {
      sent.current = false;
      return;
    }
    if (sent.current) return;
    sent.current = true;
    addSeat();
    setOpen(false);
  }, [open]);

  return React.isValidElement<{
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  }>(children) ? (
    React.cloneElement(children, { onClick: addSeat })
  ) : (
    <>{children}</>
  );
}
