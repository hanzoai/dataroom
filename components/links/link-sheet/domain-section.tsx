import Link from "next/link";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

import { useTeam } from "@/context/team-context";
import { Domain } from "@prisma/client";

import { ShareableLinkType } from "@/lib/types";
import { ShuffleIcon } from "lucide-react";
import { customAlphabet } from "nanoid";
import { mutate } from "swr";

import { BLOCKED_PATHNAMES } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { AddDomainModal } from "@/components/domains/add-domain-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ButtonTooltip } from "@/components/ui/tooltip";

import { DEFAULT_LINK_TYPE } from ".";

// Unambiguous alphabet: excludes easily confused characters (0/O, 1/l/I)
const generateRandomSlug = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz",
  10,
);

export default function DomainSection({
  data,
  setData,
  domains,
  linkType,
  editLink,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: Dispatch<SetStateAction<DEFAULT_LINK_TYPE>>;
  domains?: Domain[];
  linkType: ShareableLinkType;
  editLink?: boolean;
}) {
  const [isModalOpen, setModalOpen] = useState(false);
  // Initialize displayValue from data.domain when editing, otherwise "dataroom.hanzo.ai"
  const [displayValue, setDisplayValue] = useState<string>(
    editLink && data.domain ? data.domain : "dataroom.hanzo.ai",
  );
  const teamInfo = useTeam();

  const generateAndSetSlug = useCallback(() => {
    const newSlug = generateRandomSlug();
    setData((prev) => ({ ...prev, slug: newSlug }));
  }, [setData]);

  const handleDomainChange = (value: string) => {
    // Handle opening the add domain modal
    if (value === "add_domain" || value === "add_dataroom_domain") {
      setModalOpen(true);
      setData((prev) => ({ ...prev, domain: "dataroom.hanzo.ai" }));
      setDisplayValue("dataroom.hanzo.ai");
      return;
    }

    // Custom domain selection: auto-generate a slug if there isn't one yet
    if (value !== "dataroom.hanzo.ai") {
      setData((prev) => ({
        ...prev,
        domain: value,
        ...(!prev.slug && { slug: generateRandomSlug() }),
      }));
      setDisplayValue(value);
      return;
    }

    setData((prev) => ({ ...prev, domain: value }));
    setDisplayValue(value);
  };

  const handleSelectFocus = () => {
    // Assuming your fetcher key for domains is '/api/teams/:teamId/domains'
    mutate(`/api/teams/${teamInfo?.currentTeam?.id}/domains`);
  };

  useEffect(() => {
    if (domains && !editLink) {
      const domainValue =
        domains.find((domain) => domain.isDefault)?.slug ?? "dataroom.hanzo.ai";

      // Auto-generate a slug when a custom domain is auto-selected as default
      const isCustomDomain = domainValue !== "dataroom.hanzo.ai";

      setData((prev) => ({
        ...prev,
        domain: domainValue,
        ...(isCustomDomain && !prev.slug && { slug: generateRandomSlug() }),
      }));

      setDisplayValue(domainValue);
    }
  }, [domains, editLink, linkType]);

  const defaultDomain = editLink
    ? (data.domain ?? "dataroom.hanzo.ai")
    : (domains?.find((domain) => domain.isDefault)?.slug ??
      "dataroom.hanzo.ai");

  // Set the initial display value when component mounts
  useEffect(() => {
    setDisplayValue(defaultDomain);
  }, [defaultDomain, editLink]);

  const currentDomain = domains?.find((domain) => domain.slug === data.domain);
  const isDomainVerified = currentDomain?.verified;

  const isSlugInvalid =
    !!data.slug &&
    (!/^[a-zA-Z0-9-]+$/.test(data.slug) ||
      BLOCKED_PATHNAMES.includes(`/${data.slug}`));

  return (
    <>
      <Label htmlFor="link-domain">Domain</Label>
      <div className="flex">
        <Select
          value={displayValue}
          onValueChange={handleDomainChange}
          onOpenChange={handleSelectFocus}
        >
          <SelectTrigger
            className={cn(
              "flex h-10 w-full rounded-none rounded-l-md border border-input bg-white text-foreground placeholder-muted-foreground focus:border-muted-foreground focus:outline-none focus:ring-inset focus:ring-muted-foreground dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent sm:text-sm",
              data.domain && data.domain !== "dataroom.hanzo.ai"
                ? ""
                : "border-r-1 rounded-r-md",
            )}
          >
            <SelectValue placeholder="Select a domain" />
          </SelectTrigger>
          <SelectContent className="flex w-full rounded-md border border-input bg-white text-foreground placeholder-muted-foreground focus:border-muted-foreground focus:outline-none focus:ring-inset focus:ring-muted-foreground dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent sm:text-sm">
            <SelectItem value="dataroom.hanzo.ai" className="hover:bg-muted">
              dataroom.hanzo.ai
            </SelectItem>
            {domains?.map(({ slug }) => (
              <SelectItem
                key={slug}
                value={slug}
                className="hover:bg-muted hover:dark:bg-gray-700"
              >
                {slug}
              </SelectItem>
            ))}
            <SelectItem
              className="hover:bg-muted hover:dark:bg-gray-700"
              value={
                linkType === "DOCUMENT_LINK"
                  ? "add_domain"
                  : "add_dataroom_domain"
              }
            >
              Add a custom domain ✨
            </SelectItem>
          </SelectContent>
        </Select>

        {data.domain && data.domain !== "dataroom.hanzo.ai" ? (
          <>
            <Input
              type="text"
              name="key"
              required
              value={data.slug || ""}
              pattern="^[a-zA-Z0-9-]+$"
              onKeyDown={(e) => {
                // Allow navigation keys, backspace, delete, etc.
                if (e.key.length === 1 && !/^[a-zA-Z0-9-]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onInvalid={(e) => {
                const currentValue = e.currentTarget.value;
                const isBlocked = BLOCKED_PATHNAMES.includes(
                  `/${currentValue}`,
                );

                if (isBlocked) {
                  e.currentTarget.setCustomValidity(
                    "This pathname is blocked. Please choose another one.",
                  );
                } else {
                  e.currentTarget.setCustomValidity(
                    "Only letters, numbers, and '-' are allowed.",
                  );
                }
              }}
              autoComplete="off"
              className="flex rounded-none focus:ring-inset"
              placeholder="deck"
              onChange={(e) => {
                const currentValue = e.target.value.replace(
                  /[^a-zA-Z0-9-]/g,
                  "",
                );
                const isBlocked = BLOCKED_PATHNAMES.includes(
                  `/${currentValue}`,
                );

                if (isBlocked) {
                  e.currentTarget.setCustomValidity(
                    "This pathname is blocked. Please choose another one.",
                  );
                } else {
                  e.currentTarget.setCustomValidity("");
                }
                setData((prev) => ({ ...prev, slug: currentValue }));
              }}
              aria-invalid={isSlugInvalid}
            />
            <ButtonTooltip content="Generate random slug">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 min-w-10 rounded-l-none border-l-0"
                onClick={(e) => {
                  e.preventDefault();
                  generateAndSetSlug();
                }}
              >
                <ShuffleIcon className="h-4 w-4" />
              </Button>
            </ButtonTooltip>
          </>
        ) : null}
      </div>

      {data.domain &&
      data.domain !== "dataroom.hanzo.ai" &&
      !isDomainVerified ? (
        <div className="mt-4 text-sm text-red-500">
          Your domain is not verified yet!{" "}
          <Link
            className="underline hover:text-red-500/80"
            href="/settings/domains"
            target="_blank"
          >
            Verify now
          </Link>
        </div>
      ) : null}

      {/* Add domain modal for custom domains */}
      <AddDomainModal open={isModalOpen} setOpen={setModalOpen} />
    </>
  );
}
