"use client";

import { CheckIcon, CopyIcon, LucideIcon } from "lucide-react";
import { toast } from "@hanzo/ui";

import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";
import { classNames } from "@/lib/utils";

export function CopyButton({
  value,
  className,
  icon,
  successMessage,
}: {
  value: string;
  className?: string;
  icon?: LucideIcon;
  successMessage?: string;
  variant?: "default" | "neutral";
}) {
  const [copied, copyToClipboard] = useCopyToClipboard();
  const Comp = icon || CopyIcon;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toast.promise(copyToClipboard(value), {
          success: successMessage || "Copied to clipboard!",
        });
      }}
      className={classNames("copy-button", className ?? "")}
      style={{
        background: "transparent",
        borderRadius: "9999px",
        padding: "0.375rem",
        border: "none",
        cursor: "pointer",
      }}
      type="button"
    >
      <span className="sr-only">Copy</span>
      {copied ? (
        <CheckIcon style={{ height: 14, width: 14 }} />
      ) : (
        <Comp style={{ height: 14, width: 14 }} />
      )}
    </button>
  );
}
