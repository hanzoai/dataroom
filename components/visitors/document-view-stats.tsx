import { useEffect, useRef, useState } from "react";

import { ChevronRight, DownloadCloudIcon } from "lucide-react";

import BarChartComponent from "@/components/charts/bar-chart";
import StatsChartSkeleton from "@/components/documents/stats-chart-skeleton";
import { Gauge } from "@/components/ui/gauge";
import { Skeleton } from "@/components/ui/skeleton";

import { useDataroomDocumentPageStats } from "@/lib/swr/use-dataroom-view-document-stats";
import { durationFormat } from "@/lib/utils";

export function DocumentViewDuration({
  duration,
  loading,
}: {
  duration: number;
  loading?: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-4 w-16" />;
  }
  return (
    <span className="text-sm text-muted-foreground">
      {durationFormat(duration)}
    </span>
  );
}

export function DocumentViewCompletion({
  completionRate,
  loading,
}: {
  completionRate: number;
  loading?: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-6 w-6 rounded-full" />;
  }
  return <Gauge value={completionRate} size={"small"} showValue={true} />;
}

export function DocumentPageChart({
  dataroomId,
  dataroomViewId,
  documentViewId,
  documentId,
  totalPages,
  downloadType,
  downloadMetadata,
}: {
  dataroomId: string;
  dataroomViewId: string;
  documentViewId: string;
  documentId: string;
  totalPages: number;
  downloadType?: "SINGLE" | "BULK" | "FOLDER" | null;
  downloadMetadata?: {
    folderName?: string;
    folderPath?: string;
    dataroomName?: string;
    documentCount?: number;
    documents?: { id: string; name: string }[];
  } | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isExpanded) {
      timerRef.current = setTimeout(() => {
        setFetchEnabled(true);
      }, 150);
    } else {
      clearTimeout(timerRef.current);
      setFetchEnabled(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [isExpanded]);

  const { duration, loading } = useDataroomDocumentPageStats({
    dataroomId,
    dataroomViewId,
    documentViewId,
    documentId,
    enabled: fetchEnabled,
  });

  const handleToggle = () => setIsExpanded((prev) => !prev);

  if (!isExpanded) {
    return (
      <button
        onClick={handleToggle}
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight className="h-3 w-3" />
        Show page-by-page
      </button>
    );
  }

  if (loading || !duration) {
    return (
      <div>
        <button
          onClick={handleToggle}
          className="mb-1 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="h-3 w-3 rotate-90 transition-transform" />
          Hide page-by-page
        </button>
        <StatsChartSkeleton className="border-none px-0" />
      </div>
    );
  }

  const hasViewData = duration.data.some((item) => item.sum_duration > 0);

  if (!hasViewData && downloadType) {
    let downloadMessage = "";
    if (downloadType === "FOLDER" && downloadMetadata?.folderName) {
      downloadMessage = `Downloaded without viewing via folder "${downloadMetadata.folderName}"`;
    } else if (downloadType === "BULK") {
      downloadMessage = "Downloaded without viewing via bulk download";
    } else if (downloadType === "SINGLE") {
      downloadMessage = "Downloaded without viewing";
    } else {
      downloadMessage = "Downloaded without viewing";
    }

    return (
      <div>
        <button
          onClick={handleToggle}
          className="mb-1 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="h-3 w-3 rotate-90 transition-transform" />
          Hide page-by-page
        </button>
        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <DownloadCloudIcon className="h-4 w-4" />
          <span>{downloadMessage}</span>
        </div>
      </div>
    );
  }

  let durationData = Array.from({ length: totalPages }, (_, i) => ({
    pageNumber: (i + 1).toString(),
    sum_duration: 0,
  }));

  durationData = durationData.map((item) => {
    const match = duration.data.find((d) => d.pageNumber === item.pageNumber);
    return match || item;
  });

  return (
    <div>
      <button
        onClick={handleToggle}
        className="mb-1 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight className="h-3 w-3 rotate-90 transition-transform" />
        Hide page-by-page
      </button>
      <div className="pb-0.5 pl-0.5 md:pb-1 md:pl-1">
        <BarChartComponent data={durationData} isSum={true} />
      </div>
    </div>
  );
}
