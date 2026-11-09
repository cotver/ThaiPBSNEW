import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Keeps the full Referer on same-origin requests, which the Airflow proxy checks.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Isolates the site's window from pages it opens or that open it (blocks window.opener tricks).
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // A minimal CSP that cannot break scripts, styles or embeds: no plugins, no <base> hijacking,
  // forms post only here, and only this site may frame its pages (the admin Live Preview).
  {
    key: "Content-Security-Policy",
    value: "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'",
  },
  // HSTS only when the site has a trusted certificate; with the current self-signed one, browsers
  // would refuse to let visitors through at all. Set ENABLE_HSTS=true after switching certificates.
  ...(process.env.ENABLE_HSTS === "true"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  deprecated: {
    // Next 16.4 strict matching counts the (site) @marketEventModal catch-all against /admin and /prototype
    // pages in other route groups and fails the build. Remove once that modal no longer uses a root catch-all.
    looseRouteMatching: true,
  },
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
