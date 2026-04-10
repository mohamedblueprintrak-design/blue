import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  allowedDevOrigins: ["*"],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  // Turbopack is the default bundler in Next.js 16
  turbopack: {},

  // Packages that must not be bundled for the client
  serverExternalPackages: [
    'bcryptjs',
    'winston',
    'winston-daily-rotate-file',
    'redis',
    'socket.io',
    'jsonwebtoken',
    'nodemailer',
    'sharp',
    '@prisma/client',
    'jspdf',
    'jspdf-autotable',
    'jose',
    'otplib',
  ],

  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Blue',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Redirects
  async redirects() {
    return [
      { source: '/home', destination: '/dashboard', permanent: true },
    ];
  },

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.stripe.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Security headers
  async headers() {
    return [
      {
        // API routes — stricter CSP, CORS headers
        source: '/api/:path*',
        headers: [
          // CORS headers
          { key: 'Access-Control-Allow-Origin', value: process.env.CORS_ORIGINS?.split(',')[0]?.trim() || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Authorization, Content-Type, X-CSRF-Token, Cache-Control' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          // Security headers
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Content-Security-Policy', value: "default-src 'none'; frame-ancestors 'none';" },
        ],
      },
      {
        // Page routes — full security headers including HSTS
        source: '/((?!api/).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          // HSTS only in production
          ...(process.env.NODE_ENV === 'production' ? [
            { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          ] : []),
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: avatars.githubusercontent.com lh3.googleusercontent.com https://*.tile.openstreetmap.org https://*.openstreetmap.org",
              "font-src 'self' data:",
              "connect-src 'self' https://*.openstreetmap.org https://*.tile.openstreetmap.org https://api.stripe.com https://checkout.stripe.com",
              "frame-src 'self' js.stripe.com https://www.openstreetmap.org https://*.openstreetmap.org https://hooks.stripe.com https://checkout.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
