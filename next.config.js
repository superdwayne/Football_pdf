/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are enabled by default in Next.js 16+
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"],
  outputFileTracingIncludes: {
    "/api/pdf/**": ["./node_modules/@sparticuz/chromium-min/**"],
    "/api/pdf/from-airtable/**": ["./node_modules/@sparticuz/chromium-min/**"],
  },
}

module.exports = nextConfig

