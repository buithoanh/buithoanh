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
  openGraph: { siteName: site.name, locale: "vi_VN", type: "website" },
  icons: { icon: "/favicon.svg" },
};

export const viewport = { themeColor: "#13283f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" />
      </head>
      <body>
        {children}
        <TheoDoiSuKien />
      </body>
    </html>
  );
}
