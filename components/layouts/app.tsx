import { useRouter } from "next/router";

import { useCallback, useEffect, useRef, useState } from "react";

import Cookies from "js-cookie";

import { AppBreadcrumb } from "@/components/layouts/breadcrumb";
import TrialBanner from "@/components/layouts/trial-banner";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SIDEBAR_COOKIE_NAME,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { BlockingModal } from "./blocking-modal";

const DATAROOM_SIDEBAR_COOKIE_NAME = "sidebar:dataroom-state";

// The sidebar starts open everywhere except inside a dataroom. Server and
// client both reach this from the path alone, so their renders agree.
function defaultSidebarState(isDataroom: boolean): boolean {
  return !isDataroom;
}

// The visitor's saved preference, or undefined when they have none.
// Cookies are readable only in the browser, so call this after mount.
function storedSidebarState(isDataroom: boolean): boolean | undefined {
  const cookie = Cookies.get(
    isDataroom ? DATAROOM_SIDEBAR_COOKIE_NAME : SIDEBAR_COOKIE_NAME,
  );
  return cookie === undefined ? undefined : cookie === "true";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isDataroom = router.pathname.startsWith("/datarooms/[id]");

  const [sidebarOpen, setSidebarOpen] = useState(
    defaultSidebarState(isDataroom),
  );

  // Track previous dataroom state for transitions
  const prevIsDataroomRef = useRef<boolean>(isDataroom);
  const isFirstRenderRef = useRef(true);

  // Handle initial mount and transitions between dataroom/non-dataroom
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      // Apply the saved preference now that the cookie is readable. Doing it
      // here rather than during render keeps hydration matching the server.
      const stored = storedSidebarState(isDataroom);
      if (stored !== undefined) {
        setSidebarOpen(stored);
      } else if (isDataroom) {
        Cookies.set(DATAROOM_SIDEBAR_COOKIE_NAME, "false", { expires: 7 });
      }
      return;
    }

    // Transitioning from non-dataroom to dataroom
    if (!prevIsDataroomRef.current && isDataroom) {
      setSidebarOpen(false);
      Cookies.set(DATAROOM_SIDEBAR_COOKIE_NAME, "false", { expires: 7 });
    }

    // Transitioning from dataroom to non-dataroom
    if (prevIsDataroomRef.current && !isDataroom) {
      Cookies.remove(DATAROOM_SIDEBAR_COOKIE_NAME);
      setSidebarOpen(storedSidebarState(false) ?? defaultSidebarState(false));
    }

    prevIsDataroomRef.current = isDataroom;
  }, [isDataroom]);

  // Handle sidebar state changes - save to appropriate cookie
  const handleSidebarOpenChange = useCallback(
    (open: boolean) => {
      setSidebarOpen(open);
      if (isDataroom) {
        Cookies.set(DATAROOM_SIDEBAR_COOKIE_NAME, String(open), { expires: 7 });
      }
    },
    [isDataroom],
  );

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={handleSidebarOpenChange}>
      <div className="flex flex-1 flex-col gap-x-1 bg-gray-50 dark:bg-black md:flex-row">
        <AppSidebar />
        <SidebarInset className="ring-1 ring-gray-200 dark:ring-gray-800">
          <header className="flex h-10 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-4" />
              <AppBreadcrumb />
            </div>
          </header>
          <TrialBanner />
          <BlockingModal />
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
