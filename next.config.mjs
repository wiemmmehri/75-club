/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ["@libsql/client", "libsql"] },
  transpilePackages: ["three"],
};
export default nextConfig;
