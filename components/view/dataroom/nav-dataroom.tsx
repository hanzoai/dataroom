import Link from "next/link";

import React, { useEffect, useMemo, useState } from "react";

import { DataroomBrand } from "@prisma/client";
import { BadgeInfoIcon, Download } from "lucide-react";
import { toast } from "sonner";

import { formatDate } from "@/lib/utils";

import {
  ButtonTooltip,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Button } from "../../ui/button";
import { ViewerDownloadProgressModal } from "./viewer-download-progress-modal";

const DEFAULT_BANNER_IMAGE = "/_static/hanzo-dataroom-banner.png";

export default function DataroomNav({
  allowDownload,
  allowBulkDownload,
  brand,
  viewId,
  linkId,
  dataroom,
  isPreview,
  dataroomId,
  viewerId,
  viewerEmail,
  isTeamMember,
}: {
  allowDownload?: boolean;
  allowBulkDownload?: boolean;
  brand?: Partial<DataroomBrand>;
  viewId?: string;
  linkId?: string;
  dataroom?: any;
  isPreview?: boolean;
  dataroomId?: string;
  viewerId?: string;
  viewerEmail?: string | null;
  isTeamMember?: boolean;
}) {
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [downloadModalJobId, setDownloadModalJobId] = useState<string | null>(null);
  const [downloadFolderId, setDownloadFolderId] = useState<string | null>(null);
  const [downloadFolderName, setDownloadFolderName] = useState<string | null>(null);

  // Derive downloads page URL from current path so it works for both
  // /view/<linkId>/downloads and /<slug>/downloads (custom domains)
  const downloadsPageUrl = useMemo(() => {
    if (typeof window === "undefined") return "/downloads";
    const path = window.location.pathname.replace(/\/+$/, "");
    return `${path}/downloads`;
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent<{ jobId?: string; folderId?: string; folderName?: string }>) => {
      setDownloadModalJobId(e.detail?.jobId ?? null);
      setDownloadFolderId(e.detail?.folderId ?? null);
      setDownloadFolderName(e.detail?.folderName ?? null);
      setShowDownloadModal(true);
    };
    window.addEventListener(
      "viewer-download-modal-open" as any,
      handler as EventListener,
    );
    return () =>
      window.removeEventListener(
        "viewer-download-modal-open" as any,
        handler as EventListener,
      );
  }, []);

  const openDownloadModal = () => {
    if (isPreview) {
      toast.error("You cannot download datarooms in preview mode.");
      return;
    }
    if (!allowDownload || !allowBulkDownload) return;
    if (!viewerEmail) {
      toast.error("Enter your email in the dataroom to download.");
      return;
    }
    setDownloadModalJobId(null);
    setDownloadFolderId(null);
    setDownloadFolderName(null);
    setShowDownloadModal(true);
  };

  return (
    <nav
      className="bg-black"
      style={{
        backgroundColor: brand && brand.brandColor ? brand.brandColor : "black",
      }}
    >
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-start">
            <div className="relative flex h-16 w-36 flex-shrink-0 items-center">
              {brand && brand.logo ? (
                <img
                  className="h-16 w-36 object-contain"
                  src={brand.logo}
                  alt="Logo"
                />
              ) : (
                <Link
                  href={`https://dataroom.hanzo.ai?utm_campaign=navbar&utm_medium=navbar&utm_source=dataroom-${linkId}`}
                  target="_blank"
                  className="text-2xl font-bold tracking-tighter text-white"
                >
                  Hanzo Dataroom
                </Link>
              )}
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center space-x-4 pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {isTeamMember ? (
              <TooltipProvider delayDuration={100}>
                <Tooltip defaultOpen>
                  <TooltipTrigger asChild>
                    <Button
                      className="size-8 bg-gray-900 text-white hover:bg-gray-900/80 sm:size-10"
                      size="icon"
                    >
                      <BadgeInfoIcon className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-wrap text-center">
                      Skipped verification because you are a team member; no
                      analytics will be collected
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
            {allowDownload && allowBulkDownload && viewerEmail ? (
              <ButtonTooltip content="Download Dataroom">
                <Button
                  onClick={openDownloadModal}
                  className="m-1 bg-gray-900 text-white hover:bg-gray-900/80"
                  size="icon"
                >
                  <Download className="h-5 w-5" />
                </Button>
              </ButtonTooltip>
            ) : null}
          </div>
        </div>
      </div>

      {/* Banner section */}
      {brand?.banner !== "no-banner" && (
        <div className="relative h-[20vh] sm:h-auto sm:max-h-80">
          <img
            className="h-full w-full object-cover sm:max-h-80 sm:object-contain xl:object-cover"
            src={brand?.banner || DEFAULT_BANNER_IMAGE}
            alt="Banner"
            width={1920}
            height={320}
          />
          <div className="absolute bottom-5 w-fit rounded-r-md bg-white/30 backdrop-blur-md">
            <div className="px-5 py-2 sm:px-10">
              <div className="text-3xl">{dataroom.name}</div>
              {dataroom.showLastUpdated ? (
                <time
                  className="mt-1 block text-sm"
                  dateTime={new Date(dataroom.lastUpdatedAt).toISOString()}
                >
                  {`Last updated ${formatDate(dataroom.lastUpdatedAt)}`}
                </time>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {linkId && viewId && viewerEmail && (
        <ViewerDownloadProgressModal
          isOpen={showDownloadModal}
          onClose={() => {
            setShowDownloadModal(false);
            setDownloadModalJobId(null);
            setDownloadFolderId(null);
            setDownloadFolderName(null);
          }}
          linkId={linkId}
          viewId={viewId}
          viewerEmail={viewerEmail}
          dataroomName={dataroom?.name ?? ""}
          dataroomId={dataroomId}
          downloadsPageUrl={downloadsPageUrl}
          initialJobId={downloadModalJobId ?? undefined}
          folderId={downloadFolderId}
          folderName={downloadFolderName}
        />
      )}
    </nav>
  );
}
