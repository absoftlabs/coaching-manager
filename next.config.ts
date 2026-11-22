import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Self-contained build in .next/standalone for manual deployment.
    output: "standalone",
    // Student/teacher photos and the logo are stored as data URLs in MySQL,
    // so plain <img> tags are used and no remote image domains are needed.
    experimental: {
        serverActions: { bodySizeLimit: "5mb" },
    },
};

export default nextConfig;
