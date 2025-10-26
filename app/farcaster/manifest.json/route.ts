import { NextResponse, type NextRequest } from "next/server";
import { withValidManifest } from "@coinbase/onchainkit/minikit";

export const revalidate = 3600;

export function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const manifest = withValidManifest({
    miniapp: {
      version: "1",
      name: "Mini Math Quiz",
      description: "Sharpen your arithmetic with a quick-fire math quiz that works perfectly inside Farcaster Mini Apps.",
      iconUrl: `${origin}/sphere.svg`,
      homeUrl: origin,
      splashImageUrl: `${origin}/sphere.svg`,
      termsUrl: origin,
      supportUrl: origin,
      categories: ["education", "games"],
    },
  });

  return NextResponse.json(manifest);
}
