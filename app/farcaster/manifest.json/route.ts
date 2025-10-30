import { NextResponse, type NextRequest } from "next/server";
import { withValidManifest } from "@coinbase/onchainkit/minikit";

export const revalidate = 3600;

export function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const manifest = withValidManifest({
    accountAssociation: {
      header:
        "eyJmaWQiOjE0MDE0NzUsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg0NjAwMTgxMDMyOUVlZGVkMWEzQ0ZhNzI3RTdEQjRhMUEyYUJFODk3In0",
      payload: "eyJkb21haW4iOiJtaW5pLW1hdGgtcXVpei52ZXJjZWwuYXBwIn0",
      signature:
        "VLHh4YafS0yaBW1mJBJH3R4hnaMPRzZyp5cqXIoh6tFrhzvA5tbUDWu3cr1REXJwecG7V++7RX57uaV0UF2Udhw=",
    },
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
    baseBuilder: {
      ownerAddress: "0xACAFA638CB6736f54e9616F72DF895B0199b8Ba8",
    },
  });

  return NextResponse.json(manifest);
}
