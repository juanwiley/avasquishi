/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
 images: {
    remotePatterns: [
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "hspsssuiqqgfvuztlvps.supabase.co" },
      { protocol: "https", hostname: "files.stripe.com" },
      { protocol: "https", hostname: "images.unsplash.com" }, // if you ever use it
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // optional
    ],
  },
};

export default nextConfig;
