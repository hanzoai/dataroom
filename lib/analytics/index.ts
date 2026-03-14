import { emptyAnalytics, jitsuAnalytics } from "@jitsu/js";
import { insights } from "@hanzo/insights";

import { getInsightsConfig } from "@/lib/insights";
import { AnalyticsEvents } from "@/lib/types";

export function useAnalytics() {
  const isInsightsEnabled = getInsightsConfig();

  /**
   * Capture an analytic event.
   *
   * @param event The event name.
   * @param properties Properties to attach to the event.
   */
  const capture = (event: string, properties?: Record<string, unknown>) => {
    if (!isInsightsEnabled) {
      return;
    }

    insights.capture(event, properties);
  };

  const identify = (
    distinctId?: string,
    properties?: Record<string, unknown>,
  ) => {
    if (!isInsightsEnabled) {
      return;
    }

    insights.identify(distinctId, properties);
  };

  return {
    capture,
    identify,
  };
}

// For server-side tracking
const analytics =
  process.env.JITSU_HOST && process.env.JITSU_WRITE_KEY
    ? jitsuAnalytics({
        host: process.env.JITSU_HOST,
        writeKey: process.env.JITSU_WRITE_KEY,
      })
    : emptyAnalytics;

export const identifyUser = (userId: string) => analytics.identify(userId);
export const trackAnalytics = (args: AnalyticsEvents) => analytics.track(args);
