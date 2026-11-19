import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // The browser reaches the GraphQL server through this app's own address, so one public port is enough (as on Azure).
  async rewrites() {
    return [{ source: "/graphql", destination: `http://localhost:${process.env.GRAPHQL_PORT ?? 4000}/graphql` }];
  },
  turbopack: {
    root: path.join(__dirname, ".."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
