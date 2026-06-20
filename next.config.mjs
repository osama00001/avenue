/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://192.168.1.10:3000",
  ],
  async redirects() {
    return [
      { source: "/terms", destination: "/cms/terms-conditions", permanent: true },
      { source: "/privacy", destination: "/cms/privacy-notice", permanent: true },
      { source: "/cms/terms", destination: "/cms/terms-conditions", permanent: true },
      { source: "/cms/privacy", destination: "/cms/privacy-notice", permanent: true },
    ];
  },
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
