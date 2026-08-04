"use client";

import Link from "next/link";

import { useTeam } from "@/context/team-context";
import { ChevronRight, type LucideIcon } from "lucide-react";

import { useAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

import { Shimmer } from "@/components/ui/shimmer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  current?: boolean;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
    current?: boolean;
  }[];
}

export function NavMain({ items }: { items: NavItem[] }) {
  const analytics = useAnalytics();
  const teamInfo = useTeam();

  const handleItemClick = (title: string) => {
    if (title === "2025 Recap") {
      analytics.capture("YIR: Banner Opened", {
        source: "sidebar",
        teamId: teamInfo?.currentTeam?.id,
      });
    }
  };

  return (
    <SidebarGroup>
      <SidebarMenu className="space-y-0.5 text-foreground">
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className={cn(
                  item.current &&
                    item.items?.length &&
                    "rounded-md bg-gray-200 font-semibold dark:bg-secondary",
                  item.current &&
                    !item.items?.length &&
                    "rounded-md bg-gray-200 font-semibold dark:bg-secondary",
                )}
              >
                <Link
                  href={item.url}
                  className="p-2"
                  onClick={() => handleItemClick(item.title)}
                >
                  <item.icon
                    className={cn(
                      item.title === "2025 Recap" &&
                        "text-orange-500 dark:text-orange-400",
                    )}
                  />
                  {item.title === "2025 Recap" ? (
                    <Shimmer
                      as="span"
                      className="[--background:theme(colors.yellow.300)] [--muted-foreground:theme(colors.orange.500)] dark:[--background:theme(colors.yellow.200)] dark:[--muted-foreground:theme(colors.orange.400)]"
                      duration={0.5}
                      spread={3}
                      hoverOnly
                    >
                      {item.title}
                    </Shimmer>
                  ) : (
                    <span>{item.title}</span>
                  )}
                </Link>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem
                          key={subItem.title}
                          className={cn(
                            subItem.current &&
                              "rounded-md bg-gray-200 font-semibold dark:bg-secondary",
                          )}
                        >
                          <SidebarMenuSubButton asChild>
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
