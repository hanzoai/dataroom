import { useState } from "react";

import { LinkAudienceType } from "@prisma/client";

import { ShareableLinkType } from "@/lib/types";
import { LinkPreset } from "@prisma/client";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { DEFAULT_LINK_TYPE } from "@/components/links/link-sheet";
import AllowDownloadSection from "@/components/links/link-sheet/allow-download-section";
import AllowListSection from "@/components/links/link-sheet/allow-list-section";
import AllowNotificationSection from "@/components/links/link-sheet/allow-notification-section";
import DenyListSection from "@/components/links/link-sheet/deny-list-section";
import EmailAuthenticationSection from "@/components/links/link-sheet/email-authentication-section";
import EmailProtectionSection from "@/components/links/link-sheet/email-protection-section";
import ExpirationSection from "@/components/links/link-sheet/expiration-section";
import OGSection from "@/components/links/link-sheet/og-section";
import PasswordSection from "@/components/links/link-sheet/password-section";
import { ProBannerSection } from "@/components/links/link-sheet/pro-banner-section";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import AgreementSection from "./agreement-section";
import AIAgentsSection from "./ai-agents-section";
import CustomFieldsSection from "./custom-fields-section";
import IndexFileSection from "./index-file-section";
import ScreenshotProtectionSection from "./screenshot-protection-section";
import UploadSection from "./upload-section";
import WatermarkSection from "./watermark-section";
import { WelcomeMessageSection } from "./welcome-message-section";

// Collapsible Section Component
const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="mb-5 flex w-full items-center justify-between rounded-t-md border-b border-border bg-muted/50 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/70">
        <span>{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen ? "rotate-180" : "",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="pt-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const LinkOptions = ({
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
  linkType: ShareableLinkType;
  editLink?: boolean;
  currentPreset?: LinkPreset | null;
}) => {
  return (
    <div>
      {/* Basic Options - Always visible */}
      <AllowNotificationSection {...{ data, setData }} />
      <EmailProtectionSection {...{ data, setData }} />
      <EmailAuthenticationSection {...{ data, setData }} />
      <AllowDownloadSection {...{ data, setData }} />

      {data.audienceType === LinkAudienceType.GENERAL ? (
        <>
          <AllowListSection
            key={`allow-list-${data.id ?? "new"}`}
            {...{ data, setData }}
            presets={currentPreset}
          />
          <DenyListSection
            key={`deny-list-${data.id ?? "new"}`}
            {...{ data, setData }}
            presets={currentPreset}
          />
        </>
      ) : null}

      {/* Security Section */}
      <CollapsibleSection title="Security Controls" defaultOpen={true}>
        <div>
          <PasswordSection {...{ data, setData }} />
          <ExpirationSection {...{ data, setData }} presets={currentPreset} />
          <ScreenshotProtectionSection {...{ data, setData }} />
          <WatermarkSection {...{ data, setData }} presets={currentPreset} />
          <AgreementSection {...{ data, setData }} />
          <CustomFieldsSection {...{ data, setData }} presets={currentPreset} />
        </div>
      </CollapsibleSection>

      {/* Custom Branding Section */}
      <CollapsibleSection title="Custom Branding" defaultOpen={true}>
        <div>
          <WelcomeMessageSection {...{ data, setData }} />
          <OGSection
            {...{ data, setData }}
            editLink={editLink ?? false}
            presets={currentPreset}
          />
          <ProBannerSection {...{ data, setData }} />
        </div>
      </CollapsibleSection>

      {/* Advanced Section */}
      <CollapsibleSection title="Advanced Controls" defaultOpen={true}>
        <div>
          {/* AI Agents - Available for both document and dataroom links */}
          <AIAgentsSection {...{ data, setData }} />

          {/* Dataroom-specific options */}
          {linkType === "DATAROOM_LINK" ? (
            <>
              {targetId ? (
                <UploadSection {...{ data, setData }} targetId={targetId} />
              ) : null}

              <IndexFileSection {...{ data, setData }} />
            </>
          ) : null}
        </div>
      </CollapsibleSection>
    </div>
  );
};
