/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          has: [{ type: 'host', value: 'checkin\\..*' }],
          destination: '/checkin',
        },
        {
          source: '/((?!_next|api|checkin|.*\\..*).*)',
          has: [{ type: 'host', value: 'checkin\\..*' }],
          destination: '/checkin/$1',
        },
      ],
    };
  },
};

module.exports = nextConfig;
