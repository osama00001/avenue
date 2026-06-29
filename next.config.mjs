/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    proxyClientMaxBodySize: "12mb",
    middlewareClientMaxBodySize: "12mb",
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://192.168.1.10:3000",
  ],
  async redirects() {
    return [
      { source: "/terms", destination: "/cms/terms", permanent: true },
      { source: "/privacy", destination: "/cms/privacy", permanent: true },
      { source: "/cms/cookie-policy", destination: "/cms/cookies", permanent: true },
      { source: "/cms/privacy-notice", destination: "/cms/privacy", permanent: true },
      { source: "/cms/terms-conditions", destination: "/cms/terms", permanent: true },
      { source: "/cms/manage-cookies", destination: "/cms/cookies", permanent: false },
    ];
  },
  images: {
    localPatterns: [
      { pathname: "/covers/**", search: "" },
      { pathname: "/uploads/**", search: "" },
    ],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.avenuebookstore.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
