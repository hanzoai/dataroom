import { useState } from "react";

import { LinkAudienceType, LinkType } from "@prisma/client";
import { LinkPreset } from "@prisma/client";

import { DEFAULT_LINK_TYPE } from "@/components/links/link-sheet";
import AgreementSection from "@/components/links/link-sheet/agreement-section";
import AllowDownloadSection from "@/components/links/link-sheet/allow-download-section";
import AllowListSection from "@/components/links/link-sheet/allow-list-section";
import AllowNotificationSection from "@/components/links/link-sheet/allow-notification-section";
import CustomFieldsSection from "@/components/links/link-sheet/custom-fields-section";
import DenyListSection from "@/components/links/link-sheet/deny-list-section";
import EmailAuthenticationSection from "@/components/links/link-sheet/email-authentication-section";
import EmailProtectionSection from "@/components/links/link-sheet/email-protection-section";
import ExpirationSection from "@/components/links/link-sheet/expiration-section";
import FeedbackSection from "@/components/links/link-sheet/feedback-section";
import OGSection from "@/components/links/link-sheet/og-section";
import PasswordSection from "@/components/links/link-sheet/password-section";
import { ProBannerSection } from "@/components/links/link-sheet/pro-banner-section";
import QuestionSection from "@/components/links/link-sheet/question-section";
import ScreenshotProtectionSection from "@/components/links/link-sheet/screenshot-protection-section";
import UploadSection from "@/components/links/link-sheet/upload-section";
import WatermarkSection from "@/components/links/link-sheet/watermark-section";
import ChevronDown from "@/components/shared/icons/chevron-down";

export const OnboardingLinkOptions = ({
  data,
  setData,
  targetId,
  linkType,
  editLink,
  currentPreset = null,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
  targetId?: string;
  linkType: LinkType;
  editLink?: boolean;
  currentPreset?: LinkPreset | null;
}) => {
  const [showAdvancedSettings, setShowAdvancedSettings] =
    useState<boolean>(false);

  // Basic settings that are always shown
  const basicSettings = (
    <>
      <EmailProtectionSection {...{ data, setData }} />
      <AllowNotificationSection {...{ data, setData }} />
      <AllowDownloadSection {...{ data, setData }} />
      <ExpirationSection {...{ data, setData }} presets={currentPreset} />
      <PasswordSection {...{ data, setData }} />
      {/* Advanced toggle for documents only */}
      {linkType === LinkType.DOCUMENT_LINK && (
        <div className="mb-4 mt-2">
          <button
            type="button"
            className="group flex w-full items-center justify-between text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setShowAdvancedSettings((v) => !v)}
            aria-expanded={showAdvancedSettings}
          >
            <span className="text-sm font-semibold text-gray-900">
              Advanced settings
            </span>
            <span
              className={`transition-transform ${showAdvancedSettings ? "rotate-180" : ""}`}
            >
              <ChevronDown className="h-4 w-4" />
            </span>
          </button>
        </div>
      )}
    </>
  );

  // Advanced settings that are shown only when showAdvancedSettings is true
  const advancedSettings = (
    <>
      {linkType === LinkType.DATAROOM_LINK && targetId ? (
        <UploadSection {...{ data, setData }} targetId={targetId} />
      ) : null}
      <OGSection
        {...{ data, setData }}
        editLink={editLink ?? false}
        presets={currentPreset}
      />
      <EmailAuthenticationSection {...{ data, setData }} />
      {data.audienceType === LinkAudienceType.GENERAL ? (
        <AllowListSection {...{ data, setData }} presets={currentPreset} />
      ) : null}
      {data.audienceType === LinkAudienceType.GENERAL ? (
        <DenyListSection {...{ data, setData }} presets={currentPreset} />
      ) : null}
      <ScreenshotProtectionSection {...{ data, setData }} />
      <WatermarkSection {...{ data, setData }} presets={currentPreset} />
      <AgreementSection {...{ data, setData }} />
      {linkType === LinkType.DOCUMENT_LINK ? (
        <>
          <FeedbackSection {...{ data, setData }} />
          <QuestionSection {...{ data, setData }} />
        </>
      ) : null}
      <CustomFieldsSection {...{ data, setData }} presets={currentPreset} />
      {linkType === LinkType.DOCUMENT_LINK ? (
        <ProBannerSection {...{ data, setData }} />
      ) : null}
    </>
  );

  return (
    <div>
      {basicSettings}
      {showAdvancedSettings && advancedSettings}
    </div>
  );
};
