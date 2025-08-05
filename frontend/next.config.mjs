/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      // Proxy all API requests to Flask backend
      {
        source: '/login',
        destination: 'http://localhost:5000/login',
      },
      {
        source: '/admin/:path*',
        destination: 'http://localhost:5000/admin/:path*',
      },
      {
        source: '/dashboard/:path*',
        destination: 'http://localhost:5000/dashboard/:path*',
      },
      {
        source: '/messages/:path*',
        destination: 'http://localhost:5000/messages/:path*',
      },
      {
        source: '/conversations',
        destination: 'http://localhost:5000/conversations',
      },
      {
        source: '/conversation/:path*',
        destination: 'http://localhost:5000/conversation/:path*',
      },
      {
        source: '/subscription/:path*',
        destination: 'http://localhost:5000/subscription/:path*',
      },
      {
        source: '/templates/:path*',
        destination: 'http://localhost:5000/templates/:path*',
      },
    ]
  },
}

export default nextConfig
