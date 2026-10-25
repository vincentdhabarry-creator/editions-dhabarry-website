/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals = [...(config.externals || []), "@remotion/renderer", "@remotion/bundler"];
    return config;
  },
};

module.exports = nextConfig;
