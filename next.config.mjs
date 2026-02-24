/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["api-inference.huggingface.co"],
  },
  env: {
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
  },
};

export default nextConfig;
