/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Canonical Hanzo block-H mark (white) — matches @hanzo/brand.
const Mark = () => (
  <svg width={76} height={76} viewBox="0 0 67 67" fill="#fff">
    <path d="M22.21 67V44.6369H0V67H22.21Z" />
    <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" />
    <path d="M22.21 0H0V22.3184H22.21V0Z" />
    <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" />
    <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" />
  </svg>
);

/**
 * @name Hanzo OG card
 * @description Brand-consistent social/og image — monochrome, block-H, Hanzo Red rule.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get("title") || "Hanzo Dataroom";
  const tagline =
    searchParams.get("tagline") || "Secure document sharing & data rooms";
  const Inter = await fetch(
    new URL("@/public/_static/Inter-Bold.ttf", import.meta.url),
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{ fontFamily: "Inter" }}
        tw="flex flex-col justify-between w-full h-full bg-[#0A0A0A] text-white p-[88px]"
      >
        <div tw="flex flex-col">
          <Mark />
        </div>
        <div tw="flex flex-col">
          <div tw="text-[80px] font-extrabold tracking-tighter">{title}</div>
          <div tw="text-[30px] mt-3 text-white/60">{tagline}</div>
        </div>
        <div tw="flex justify-between text-[24px] text-white/70">
          <div tw="flex">github.com/hanzoai</div>
          <div tw="flex">hanzo.ai</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=3600, immutable" },
      fonts: [{ name: "Inter", data: Inter }],
    },
  );
}
