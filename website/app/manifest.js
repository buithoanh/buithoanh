import site from "../site.config.mjs";

export const dynamic = "force-static";

// Cho phép khách "Thêm vào màn hình chính" trên điện thoại, mở ra như một ứng dụng.
export default function manifest() {
  return {
    name: `${site.name} – ${site.slogan}`,
    short_name: site.name,
    description: `Sửa ô tô tận nơi tại ${site.city}.`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "vi",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
