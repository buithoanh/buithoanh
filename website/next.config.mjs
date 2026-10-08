import { withPayload } from "@payloadcms/next/withPayload";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const allowIndex = process.env.ALLOW_INDEX === "1";

const security = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];
const noindex = { key: "X-Robots-Tag", value: "noindex, nofollow" };

/** Web chạy trên server Node (cần cho trang admin, API đặt lịch, AI). Không còn xuất trang tĩnh. */
const nextConfig = {
  output: "standalone",
  // Thêm dấu / ở cuối do proxy.js lo (chỉ cho trang công khai).
  skipTrailingSlashRedirect: true,
  // Trang /quan-tri/ đọc file giao diện lúc chạy: đưa kèm vào bản standalone.
  outputFileTracingIncludes: { "/quan-tri": ["./lib/quan-tri/giao-dien.*"] },
  images: { localPatterns: [{ pathname: "/api/media/file/**" }] },
  turbopack: { root: path.resolve(dirname) },
  // App có 2 layout gốc ((frontend), (payload)): trang 404 chung cho mọi đường dẫn lạ nằm ở app/global-not-found.jsx.
  experimental: { globalNotFound: true },
  async headers() {
    return [
      // Chưa có tên miền thì chặn Google ở mọi trang; trang admin và API thì luôn chặn.
      { source: "/:path*", headers: allowIndex ? security : [...security, noindex] },
      { source: "/admin/:path*", headers: [noindex] },
      { source: "/api/:path*", headers: [noindex] },
      { source: "/quan-tri/:path*", headers: [noindex] },
      // Link riêng của khách (theo dõi đơn, thanh toán gói hội viên, mã giới thiệu)
      { source: "/don/:path*", headers: [noindex] },
      { source: "/hoi-vien/thanh-toan/:path*", headers: [noindex] },
      { source: "/gioi-thieu/:path*", headers: [noindex] },
    ];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
