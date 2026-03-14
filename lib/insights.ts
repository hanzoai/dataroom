export function getInsightsConfig(): { key: string; host: string } | null {
  const insightsKey = process.env.NEXT_PUBLIC_INSIGHTS_KEY;
  const insightsHost = `${process.env.NEXT_PUBLIC_BASE_URL}/ingest`;

  if (!insightsKey || !insightsHost) {
    return null;
  }

  return {
    key: insightsKey,
    host: insightsHost,
  };
}
