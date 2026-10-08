import "./globals.css";
import site from "../site.config.mjs";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} – Sửa ô tô tận nơi ${site.city}`, template: `%s | ${site.name}` },
  description: `${site.slogan}. Thợ tới tận nơi: ắc quy, lốp, bảo dưỡng, phanh, đọc lỗi, cứu hộ ô tô tại ${site.city}.`,
  robots: site.allowIndex ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { siteName: site.name, locale: "vi_VN", type: "website" },
};

export const viewport = { themeColor: "#13283f" };

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&display=swap" />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
