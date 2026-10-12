// Font tự chứa (gói @fontsource): không gọi Google Fonts khi khách mở trang. Mỗi file có đủ bộ chữ tiếng Việt, trình duyệt chỉ tải phần cần.
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource/be-vietnam-pro/800.css";
import "./globals.css";
import site from "@/site.config.mjs";
import TheoDoiSuKien from "@/components/chung/TheoDoiSuKien";

// Nội dung lấy từ CMS mỗi lần có người xem, nên giá, bài vừa đăng hiện ngay.
export const dynamic = "force-dynamic";

export const metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} – Sửa ô tô tận nơi ${site.city}`, template: `%s | ${site.name}` },
  description: `${site.slogan}. Thợ tới tận nơi: ắc quy, lốp, bảo dưỡng, phanh, đọc lỗi, cứu hộ ô tô tại ${site.city}.`,
  // Chưa có tên miền thật thì chặn Google (thêm header noindex trong next.config.mjs, robots.txt chặn).
  robots: site.allowIndex ? { index: true, follow: true } : { index: false, follow: false },
  // Ảnh hiện khi gửi link qua Zalo, Facebook, Messenger. Tạo lại bằng scripts/tao-anh-chia-se.mjs khi đổi tên hoặc slogan.
  openGraph: { siteName: site.name, locale: "vi_VN", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: `${site.name} – ${site.slogan}` }] },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.svg", apple: "/apple-icon.png" },
  manifest: "/manifest.webmanifest",
};

export const viewport = { themeColor: "#13283f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        {children}
        <TheoDoiSuKien />
      </body>
    </html>
  );
}
