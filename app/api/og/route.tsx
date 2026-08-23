/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * @name Headline Template
 * @description Make it pop with a headline
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get("title") || "Hanzo Dataroom Document";
  // Satori rasterises on the server, so it needs the face as bytes and cannot
  // use the @font-face from @hanzo/design. It reads TrueType and WOFF only — a
  // WOFF2 throws "Unsupported OpenType signature wOF2" — so hand it the static
  // TTF cut that @hanzo/font ships. Same family, still no vendored copy.
  const zenBold = await fetch(
    new URL("@hanzo/font/dist/fonts/zen-sans/Zen-Bold.ttf", import.meta.url),
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div tw="flex flex-col items-center justify-between w-full h-full bg-white text-black p-12">
        <div tw="text-[32px] flex items-center tracking-tighter">Hanzo Dataroom</div>
        <div tw="text-[42px] text-center">{title}</div>
        <div tw="text-[32px] flex items-center">
          Open-Source Document Sharing
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, immutable",
      },
      fonts: [
        {
          name: "Zen",
          data: zenBold,
        },
      ],
    },
  );
}
