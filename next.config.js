/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // ... andere Patterns falls vorhanden ...
    ],
    unoptimized: true // Für lokale statische Bilder
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "crypto": require.resolve("crypto-browserify"),
    }
    return config
  },
}

module.exports = nextConfig 