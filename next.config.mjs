/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable static HTML export
  output: 'export',

  // If you are using next/image component for any images in your UI
  // and deploying to a static host (like Cloudflare Pages),
  // you need to configure a custom loader or disable optimization.
  // For this speedtest UI, if no images are used, this might not be strictly necessary.
  images: {
    unoptimized: true, // Simplest option for static export if next/image is used.
  },

  // Optional: If your static host (like Cloudflare Pages) doesn't automatically
  // handle trailing slashes or if you prefer URLs to end with a slash.
  // trailingSlash: true,
};

module.exports = nextConfig;
