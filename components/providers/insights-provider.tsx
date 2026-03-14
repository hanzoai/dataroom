import { getSession } from "next-auth/react";
import insights from "@hanzo/insights";
// import { useEffect } from "react";
// import { useRouter } from "next/router";
import { InsightsProvider } from "@hanzo/insights/react";

import { getInsightsConfig } from "@/lib/insights";
import { CustomUser } from "@/lib/types";

export const InsightsCustomProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const insightsConfig = getInsightsConfig();
  // const router = useRouter();

  // Check that Insights is client-side
  if (typeof window !== "undefined" && insightsConfig) {
    insights.init(insightsConfig.key, {
      api_host: insightsConfig.host,
      ui_host: "https://insights.hanzo.ai",
      disable_session_recording: true,
      autocapture: false,
      // Enable debug mode in development
      loaded: (insights) => {
        if (process.env.NODE_ENV === "development") insights.debug();
        getSession()
          .then((session) => {
            if (session) {
              insights.identify(
                (session.user as CustomUser).email ??
                  (session.user as CustomUser).id,
                {
                  email: (session.user as CustomUser).email,
                  userId: (session.user as CustomUser).id,
                },
              );
            } else {
              insights.reset();
            }
          })
          .catch(() => {
            // Do nothing.
          });
      },
    });
  }

  // useEffect(() => {
  //   // Track page views
  //   const handleRouteChange = () => insights?.capture("$pageview");
  //   router.events.on("routeChangeComplete", handleRouteChange);

  //   return () => {
  //     router.events.off("routeChangeComplete", handleRouteChange);
  //   };
  // }, []);

  return <InsightsProvider client={insights}>{children}</InsightsProvider>;
};
