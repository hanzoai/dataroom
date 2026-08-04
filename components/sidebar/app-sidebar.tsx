"use client";

import Link from "next/link";
import { useRouter } from "next/router";

import * as React from "react";
import { useEffect, useState } from "react";

import { TeamContextType, initialState, useTeam } from "@/context/team-context";
import Cookies from "js-cookie";
import {
  BrushIcon,
  CogIcon,
  ContactIcon,
  FolderIcon,
  HouseIcon,
  Loader,
  ServerIcon,
  Sparkles as SparklesIcon,
} from "lucide-react";

import useDataroomsSimple from "@/lib/swr/use-datarooms-simple";
import { useSlackIntegration } from "@/lib/swr/use-slack-integration";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import SlackBanner from "./banners/slack-banner";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const [showSlackBanner, setShowSlackBanner] = useState<boolean | null>(null);
  const { currentTeam, teams, setCurrentTeam, isLoading }: TeamContextType =
    useTeam() || initialState;

  // Check Slack integration status
  const { integration: slackIntegration } = useSlackIntegration({
    enabled: !!currentTeam?.id,
  });

  // Fetch datarooms for the current team (simple mode - no filters or extra data)
  const { datarooms } = useDataroomsSimple();

  useEffect(() => {
    if (Cookies.get("hideSlackBanner") !== "slack-banner") {
      setShowSlackBanner(true);
    } else {
      setShowSlackBanner(false);
    }
  }, []);

  // Prepare datarooms items for sidebar (limit to first 5, sorted by most recent)
  const dataroomItems =
    datarooms && datarooms.length > 0
      ? datarooms.slice(0, 5).map((dataroom) => ({
          title: dataroom.internalName || dataroom.name,
          url: `/datarooms/${dataroom.id}/documents`,
          current:
            router.pathname.includes("/datarooms/[id]") &&
            String(router.query.id) === String(dataroom.id),
        }))
      : undefined;

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: HouseIcon,
      current: router.pathname.includes("dashboard"),
    },
    {
      title: "All Documents",
      url: "/documents",
      icon: FolderIcon,
      current:
        router.pathname.includes("documents") &&
        !router.pathname.includes("datarooms"),
    },
    {
      title: "All Datarooms",
      url: "/datarooms",
      icon: ServerIcon,
      current: router.pathname === "/datarooms",
      isActive: router.pathname.includes("datarooms"),
      items: dataroomItems,
    },
    {
      title: "Visitors",
      url: "/visitors",
      icon: ContactIcon,
      current: router.pathname.includes("visitors"),
    },
    {
      title: "Branding",
      url: "/branding",
      icon: BrushIcon,
      current:
        router.pathname.includes("branding") &&
        !router.pathname.includes("datarooms"),
    },
    {
      title: "Settings",
      url: "/settings/general",
      icon: CogIcon,
      isActive:
        router.pathname.includes("settings") &&
        !router.pathname.includes("branding") &&
        !router.pathname.includes("datarooms") &&
        !router.pathname.includes("documents"),
      items: [
        {
          title: "General",
          url: "/settings/general",
          current: router.pathname.includes("settings/general"),
        },
        {
          title: "Team",
          url: "/settings/people",
          current: router.pathname.includes("settings/people"),
        },
        {
          title: "Domains",
          url: "/settings/domains",
          current: router.pathname.includes("settings/domains"),
        },
        {
          title: "Webhooks",
          url: "/settings/webhooks",
          current: router.pathname.includes("settings/webhooks"),
        },
        {
          title: "Slack",
          url: "/settings/slack",
          current: router.pathname.includes("settings/slack"),
        },
      ],
    },
    // {
    //   title: "2025 Recap",
    //   url: "/dashboard?openRecap=true",
    //   icon: SparklesIcon,
    //   current: false,
    // },
  ];

  return (
    <Sidebar
      className="bg-gray-50 dark:bg-black"
      sidebarClassName="bg-gray-50 dark:bg-black"
      side="left"
      variant="inset"
      collapsible="icon"
      {...props}
    >
      <SidebarHeader className="gap-y-8">
        <p className="hidden w-full justify-center text-2xl font-bold tracking-tighter text-black group-data-[collapsible=icon]:inline-flex dark:text-white">
          <Link href="/dashboard">P</Link>
        </p>
        <p className="ml-2 flex items-center text-2xl font-bold tracking-tighter text-black group-data-[collapsible=icon]:hidden dark:text-white">
          <Link href="/dashboard">Hanzo Dataroom</Link>
        </p>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm">
            <Loader className="h-5 w-5 animate-spin" /> Loading teams...
          </div>
        ) : (
          <TeamSwitcher
            currentTeam={currentTeam}
            teams={teams}
            setCurrentTeam={setCurrentTeam}
          />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="group-data-[collapsible=icon]:hidden">
          <SidebarMenuItem>
            {!slackIntegration && showSlackBanner ? (
              <SlackBanner setShowSlackBanner={setShowSlackBanner} />
            ) : null}
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
