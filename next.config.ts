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
    remotePatterns: [],
  },
  reactCompiler: false,
};

export default withPayload(nextConfig);
