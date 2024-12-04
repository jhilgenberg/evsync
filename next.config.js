/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // ... andere Patterns falls vorhanden ...
    ],
    unoptimized: true // Für lokale statische Bilder
  },
}

module.exports = nextConfig 