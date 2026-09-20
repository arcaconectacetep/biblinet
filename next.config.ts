import type { NextConfig } from "next";

import { ALLOWED_COVER_HOSTS } from "./src/lib/constants";

/**
 * Conservative defaults: the app never runs inside a frame, never sends the
 * full URL as a referrer and never lets the browser sniff content types.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  images: {
    // Book covers are fetched server-side by the image optimizer, so the list
    // of hosts is explicit and matches what the book form accepts.
    remotePatterns: ALLOWED_COVER_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
