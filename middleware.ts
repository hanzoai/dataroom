import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

import AppMiddleware from "@/lib/middleware/app";

import { BLOCKED_PATHNAMES } from "./lib/constants";
import IncomingWebhookMiddleware, {
  isWebhookPath,
} from "./lib/middleware/incoming-webhooks";
import PostHogMiddleware from "./lib/middleware/posthog";

function isAnalyticsPath(path: string) {
  const pattern = /^\/ingest\/.*/;
  return pattern.test(path);
}

// App domains that should NOT be treated as custom domains
const APP_DOMAINS = [
  "localhost",
  "dataroom.hanzo.ai",
  "dataroom.hanzo.ai",
  "hanzo.ai",
  ".vercel.app",
];

function isCustomDomain(host: string) {
  if (process.env.NODE_ENV === "development") {
    return host?.includes(".local") || host?.includes("papermark.dev");
  }
  return !APP_DOMAINS.some((d) =>
    d.startsWith(".") ? host?.endsWith(d) : host?.includes(d),
  );
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/ routes
     * 2. /_next/ (Next.js internals)
     * 3. /_static (inside /public)
     * 4. /_vercel (Vercel internals)
     * 5. /favicon.ico, /sitemap.xml, /robots.txt (static files)
     */
    "/((?!api/|_next/|_static|vendor|_icons|_vercel|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  const path = req.nextUrl.pathname;
  const host = req.headers.get("host");

  if (isAnalyticsPath(path)) {
    return PostHogMiddleware(req);
  }

  // Handle incoming webhooks
  if (isWebhookPath(host)) {
    return IncomingWebhookMiddleware(req);
  }

  // For custom domains, rewrite to domain viewer routes
  // NOTE: DomainMiddleware is dynamically imported to avoid pulling ioredis
  // into the Edge Runtime bundle (Edge Runtime has no TCP/net APIs)
  if (isCustomDomain(host || "")) {
    const { default: DomainMiddleware } = await import(
      "@/lib/middleware/domain"
    );
    return DomainMiddleware(req);
  }

  // Handle standard app paths
  if (
    !path.startsWith("/view/") &&
    !path.startsWith("/verify") &&
    !path.startsWith("/unsubscribe") &&
    !path.startsWith("/notification-preferences") &&
    !path.startsWith("/auth/email")
  ) {
    return AppMiddleware(req);
  }

  // Check for blocked pathnames in view routes
  if (
    path.startsWith("/view/") &&
    (BLOCKED_PATHNAMES.some((blockedPath) => path.includes(blockedPath)) ||
      path.includes("."))
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/404";
    return NextResponse.rewrite(url, { status: 404 });
  }

  return NextResponse.next();
}
