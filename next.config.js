/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,


  // REQUIRED for Cloudflare Pages static export
  output: "export",

  images: {
    unoptimized: true,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });
    return config;
  },
};

module.exports = nextConfig;
