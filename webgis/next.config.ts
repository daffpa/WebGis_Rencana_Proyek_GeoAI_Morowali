import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Matikan StrictMode agar komponen tidak render/fetch dua kali di dev
  reactStrictMode: false,

  // Turbopack config (Next.js 16+)
  turbopack: {},

  // Header cache untuk endpoint GeoJSON dan metrics
  async headers() {
    return [
      {
        source: '/api/geojson/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      {
        source: '/api/metrics',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=600, stale-while-revalidate=3600',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
