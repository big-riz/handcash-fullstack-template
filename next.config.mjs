/** @type {import('next').NextConfig} */
// Use environment variables for proper WSL networking
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig