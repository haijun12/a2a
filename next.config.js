/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    KIMI_API_KEY: process.env.KIMI_API_KEY,
  }
}

module.exports = nextConfig