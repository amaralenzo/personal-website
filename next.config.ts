import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/",
        headers: [
          {
            key: "Link",
            value: `<https://enzoamaral.com/index.md>; rel="alternate"; type="text/markdown"`,
          },
        ],
      },
      {
        source: "/resume",
        headers: [
          {
            key: "Link",
            value: `<https://enzoamaral.com/resume.md>; rel="alternate"; type="text/markdown"`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
