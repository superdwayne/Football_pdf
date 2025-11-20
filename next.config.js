/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are enabled by default in Next.js 16+
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/api/pdf/**": ["./node_modules/@sparticuz/chromium/**"],
    "/api/pdf/from-airtable/**": ["./node_modules/@sparticuz/chromium/**"],
  },
}

module.exports = nextConfig

