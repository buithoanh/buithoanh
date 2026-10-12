// Root layout riêng cho màn quản trị /quan-tri/* (bài viết, bảng giá, mã khuyến mãi, số liệu).
// Khác nhóm (frontend): không header/footer công khai, không ghi sự kiện, luôn noindex.
// Bảng điều khiển nội dung & SEO /quan-tri/ vẫn là route handler app/quan-tri/route.ts (không dùng layout này).
// Font tự chứa (gói @fontsource): không gọi Google Fonts khi khách mở trang. Mỗi file có đủ bộ chữ tiếng Việt, trình duyệt chỉ tải phần cần.
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource/be-vietnam-pro/800.css";
import "../(frontend)/globals.css";
import "@/components/quan-tri/nen-quan-tri.css";
import site from "@/site.config.mjs";

export const dynamic = "force-dynamic";

export const metadata = {
  metadataBase: new URL(site.url),
  title: { default: `Quản trị · ${site.name}`, template: `%s · Quản trị ${site.name}` },
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: "/favicon.svg" },
};

export const viewport = { themeColor: "#13283f", width: "device-width", initialScale: 1 };

export default function LayoutQuanTri({ children }) {
  return (
    <html lang="vi">
      <body className="qt">{children}</body>
    </html>
  );
}
