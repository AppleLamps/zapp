/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Next.js to treat this folder as the workspace root and avoid
  // picking up parent directories that have unrelated lockfiles.
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;