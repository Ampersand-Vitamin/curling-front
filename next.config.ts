import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rpaszudjnhpmsudnpvbx.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "xzjhaobvxvjmeoqipatu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "k.kakaocdn.net" },
      { protocol: "http", hostname: "img1.kakaocdn.net" },
      { protocol: "http", hostname: "t1.kakaocdn.net" },
    ],
  },
};

export default nextConfig;
