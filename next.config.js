/** @type {import('next').NextConfig} */
const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
let r2Hostname = null;
try {
  if (r2PublicUrl) r2Hostname = new URL(r2PublicUrl).hostname;
} catch {
  r2Hostname = null;
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      ...(r2Hostname
        ? [
            { protocol: 'https', hostname: r2Hostname, pathname: '/**' },
            { protocol: 'http', hostname: r2Hostname, pathname: '/**' },
          ]
        : []),
      { protocol: 'https', hostname: '**.r2.dev', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;
