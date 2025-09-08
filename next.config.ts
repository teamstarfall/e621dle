import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "static1.e621.net",
                port: "", // leave empty unless using a custom port
                pathname: "/**", // allow all paths
            },
        ],
    },
};

export default nextConfig;
