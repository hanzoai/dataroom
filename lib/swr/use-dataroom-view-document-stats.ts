import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export type DocumentViewStats = {
  viewId: string;
  documentId: string;
  totalDuration: number;
  pagesViewed: number;
  totalPages: number;
  completionRate: number;
};

export function useDataroomViewDocumentStats({
  dataroomId,
  dataroomViewId,
  enabled = false,
}: {
  dataroomId: string;
  dataroomViewId: string;
  enabled?: boolean;
}) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data, error } = useSWR<{ documentStats: DocumentViewStats[] }>(
    enabled && teamId && dataroomId && dataroomViewId
      ? `/api/teams/${teamId}/datarooms/${dataroomId}/views/${dataroomViewId}/document-stats`
      : null,
    fetcher,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    },
  );

  return {
    documentStats: data?.documentStats,
    loading: enabled ? !error && !data : false,
    error,
  };
}

type PageDurationData = {
  pageNumber: string;
  sum_duration: number;
};

export function useDataroomDocumentPageStats({
  dataroomId,
  dataroomViewId,
  documentViewId,
  documentId,
  enabled = false,
}: {
  dataroomId: string;
  dataroomViewId: string;
  documentViewId: string;
  documentId: string;
  enabled?: boolean;
}) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data, error } = useSWR<{ duration: { data: PageDurationData[] } }>(
    enabled && teamId && dataroomId && dataroomViewId && documentViewId && documentId
      ? `/api/teams/${teamId}/datarooms/${dataroomId}/views/${dataroomViewId}/document-stats?documentViewId=${documentViewId}&documentId=${documentId}`
      : null,
    fetcher,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    },
  );

  return {
    duration: data?.duration,
    loading: enabled ? !error && !data : false,
    error,
  };
}
