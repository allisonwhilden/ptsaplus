import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // Build optimizations
  experimental: {
    // Enable parallel routes compilation
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
    
    // Optimize package imports
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@clerk/nextjs",
      "@supabase/supabase-js"
    ],
    
    // Speed up builds
    webpackBuildWorker: true,
  },
  
  // Reduce bundle size
  productionBrowserSourceMaps: false,
  
  // Image optimization
  images: {
    domains: [],
    formats: ["image/avif", "image/webp"],
  },
  
  // TypeScript and ESLint
  typescript: {
    // During development, skip type checking for faster builds
    // Vercel will still check types during production builds
    ignoreBuildErrors: process.env.NODE_ENV === "development",
  },
  eslint: {
    // Skip ESLint during builds (run separately)
    ignoreDuringBuilds: true,
  },
  
  // Output configuration
  output: "standalone",
  
  // Headers for performance
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          }
        ],
      },
    ];
  },
};

export default nextConfig;
