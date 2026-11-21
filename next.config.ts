import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Student/teacher photos and the logo are stored as data URLs in MySQL,
    // so plain <img> tags are used and no remote image domains are needed.
    experimental: {
        serverActions: { bodySizeLimit: "5mb" },
    },
};

export default nextConfig;
