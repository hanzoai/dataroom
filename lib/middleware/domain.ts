import { NextRequest, NextResponse } from "next/server";

import { BLOCKED_PATHNAMES } from "@/lib/constants";

export default async function DomainMiddleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const host = req.headers.get("host");

  // If it's the root path, check for a configured redirect URL via API
  // (Redis can't be used directly in Edge Runtime — no TCP support)
  if (path === "/") {
    if (host) {
      try {
        const apiUrl = new URL("/api/internal/domain-redirect", req.url);
        apiUrl.searchParams.set("host", host);
        const res = await fetch(apiUrl.toString(), {
          headers: { "x-middleware-internal": "1" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.redirectUrl) {
            return NextResponse.redirect(new URL(data.redirectUrl, req.url), {
              status: 302,
            });
          }
        }
      } catch {
        // If API is unavailable, fall through
      }
    }

    return NextResponse.redirect(
      new URL("https://dataroom.hanzo.ai", req.url),
    );
  }

  const url = req.nextUrl.clone();

  // Check for blocked pathnames
  if (BLOCKED_PATHNAMES.includes(path) || path.includes(".")) {
    url.pathname = "/404";
    return NextResponse.rewrite(url, { status: 404 });
  }

  // Rewrite the URL to the correct page component for custom domains
  url.pathname = `/view/domains/${host}${path}`;

  return NextResponse.rewrite(url, {
    headers: {
      "X-Robots-Tag": "noindex",
      "X-Powered-By":
        "Hanzo Dataroom - Secure Data Room Infrastructure",
    },
  });
}
