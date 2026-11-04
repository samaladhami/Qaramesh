const nextConfig = {
  allowedDevOrigins: ['192.168.1.78'],
  outputFileTracingIncludes: { '/media/*': ['./data/published-media/**/*'] },
  experimental: { serverActions: { bodySizeLimit:'3mb' } },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/glide-prod.appspot.com/**' }],
  },
};
export default nextConfig;
