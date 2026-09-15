import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  /* config options here */
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
