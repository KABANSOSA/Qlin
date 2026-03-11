/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  typescript: {
    // Отключаем проверку типов во время сборки (для ускорения)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Отключаем ESLint во время сборки (для ускорения)
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_YANDEX_MAPS_API_KEY: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '',
  },
  images: {
    domains: ['api-maps.yandex.ru'],
  },
}

module.exports = nextConfig
