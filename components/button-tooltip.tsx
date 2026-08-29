import * as React from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@hanzo/ui";

export const BadgeTooltip = ({
  content,
  children,
  linkText,
  link,
  className,
}: {
  className?: string;
  align?: "start" | "center" | "end";
  link?: string;
  content: string | React.ReactNode;
  children: React.ReactNode;
  linkText?: string;
  side?: "top" | "right" | "bottom" | "left";
}) => (
  <Tooltip>
    <TooltipTrigger asChild onPress={(e: any) => e.stopPropagation?.()}>
      {children}
    </TooltipTrigger>
    <TooltipContent sideOffset={8} className={className}>
      {typeof content === "string" ? (
        <p>
          {content}{" "}
          {link && (
            <a
              href={link}
              style={{ textDecoration: "underline", textUnderlineOffset: 4 }}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {linkText || "Learn more"}
            </a>
          )}
        </p>
      ) : (
        content
      )}
    </TooltipContent>
  </Tooltip>
);

export const ButtonTooltip = ({
  content,
  sideOffset = 0,
  className,
  children,
  link,
}: {
  content: string;
  sideOffset?: number;
  className?: string;
  children: React.ReactNode;
  link?: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent sideOffset={sideOffset} className={className}>
      {link ? (
        <p>
          {content}{" "}
          <a
            href={link}
            style={{ textDecoration: "underline", textUnderlineOffset: 4 }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more
          </a>
        </p>
      ) : (
        <p>{content}</p>
      )}
    </TooltipContent>
  </Tooltip>
);
