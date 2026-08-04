import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { BasePlan } from "@/lib/types";
import { fetcher } from "@/lib/utils";

/**
 * The team's plan tag.
 *
 * Hanzo Dataroom has no paywall — every capability is available to every team.
 * The tag records which tier a team was provisioned on (it also drives
 * background-job concurrency in lib/utils/trigger-utils) and must never be
 * read as a permission.
 */
type PlanResponse = {
  plan: BasePlan;
  startsAt: Date | null;
  endsAt: Date | null;
};

export function usePlan() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data, error, mutate } = useSWR<PlanResponse>(
    teamId ? `/api/teams/${teamId}/billing/plan` : null,
    fetcher,
  );

  return {
    plan: data?.plan ?? "free",
    startsAt: data?.startsAt,
    endsAt: data?.endsAt,
    loading: !data && !error && !!teamId,
    error,
    mutate,
  };
}
