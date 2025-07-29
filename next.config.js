/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        'node:fs': false,
        path: false,
        child_process: false,
        'node:child_process': false,
        'node:buffer': false,
        'node:url': false,
        net: false,
        'fs/promises': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig; 