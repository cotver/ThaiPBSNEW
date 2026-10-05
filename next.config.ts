import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Keeps the full Referer on same-origin requests, which the Airflow proxy checks.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Almost every page is force-dynamic, whose prefetches expire at once (default 0s), so each hover over a
    // card re-requested its page (?_rsc=) and re-rendered it on the server. Reuse a prefetch for 30s instead.
    staleTimes: { dynamic: 30 },
  },
  async redirects() {
    // Keep the entrance page available in the codebase for future use.
    return [{ source: "/", destination: "/home", permanent: false }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    localPatterns: [
      { pathname: "/api/airflow/**" },
      { pathname: "/api/**" },
      { pathname: "/**" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
        port: "",
        pathname: "/4cd45et68cgf/7LrExJ6PAj6MSIPkDyCO86/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "www.viu.com",
        port: "",
        pathname: "/ott/hk/v1/images/Viu_logo.svg",
        search: "",
      },
      {
        protocol: "https",
        hostname: "tvfinternational.com",
        port: "",
        pathname: "/themes/international/images/tvf_logo4.png",
        search: "",
      },
    ],
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "pdfjs-dist$": "pdfjs-dist/build/pdf.min.mjs",
    };

    return config;
  },
  reactCompiler: false,
};

export default withPayload(nextConfig);
