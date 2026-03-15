/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'cdn.iconscout.com' },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // pptxgenjs uses node builtins — polyfill/ignore for browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        https: false,
        http: false,
        stream: false,
        zlib: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
