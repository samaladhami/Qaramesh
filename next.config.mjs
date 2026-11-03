const nextConfig = {
  allowedDevOrigins: ['192.168.1.78'],
  experimental: { serverActions: { bodySizeLimit:'3mb' } },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/glide-prod.appspot.com/**' }],
  },
};
export default nextConfig;
