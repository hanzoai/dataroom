import Bottleneck from "bottleneck";

// we're using Bottleneck to avoid running into Resend's rate limit of 10 req/s
export const limiter = new Bottleneck({
  maxConcurrent: 1, // maximum concurrent requests
  minTime: 100, // minimum time between requests in ms
});

// Stub receiver that always verifies (no Upstash qstash)
export const receiver = {
  verify: async (_opts: { signature?: string; body: string }) => true,
};

// Stub qstash client (cron jobs run via standard scheduler, not qstash)
export const qstash = {
  publishJSON: async (_opts: any) => {
    console.warn("qstash.publishJSON called but qstash is not configured");
    return { messageId: "noop" };
  },
};
