import { ratelimit } from "@/lib/redis";

/**
 * Simple rate limiters for core endpoints
 */
export const rateLimiters = {
  // 10 auth attempts per 20 minutes per IP
  auth: ratelimit(10, "20 m"),

  // 10 billing operations per 20 minutes per IP
  billing: ratelimit(10, "20 m"),
};

/**
 * Apply rate limiting with error handling
 */
export async function checkRateLimit(
  limiter: ReturnType<typeof ratelimit>,
  identifier: string,
): Promise<{ success: boolean; remaining?: number; error?: string }> {
  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
    };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // Fail open - allow request if rate limiting fails
    return { success: true, error: "Rate limiting unavailable" };
  }
}
