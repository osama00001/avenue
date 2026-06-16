/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://192.168.1.10:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.media.strapiapp.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.strapiapp.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "1337",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
