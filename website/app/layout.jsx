// Font tự chứa (không gọi Google Fonts lúc chạy). Mỗi file có đủ bộ chữ tiếng Việt, trình duyệt chỉ tải phần cần.
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource/be-vietnam-pro/800.css";
import "./globals.css";
import site from "../site.config.mjs";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} – Sửa ô tô tận nơi ${site.city}`, template: `%s | ${site.name}` },
  description: `${site.slogan}. Thợ tới tận nơi: ắc quy, lốp, bảo dưỡng, phanh, đọc lỗi, cứu hộ ô tô tại ${site.city}.`,
  robots: site.allowIndex ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { siteName: site.name, locale: "vi_VN", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: `${site.name} – ${site.slogan}` }] },
  twitter: { card: "summary_large_image" },
  manifest: "/manifest.webmanifest",
};

export const viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
