/** Xuất trang tĩnh (thư mục out/) để chạy trên Cloudflare Pages. */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
