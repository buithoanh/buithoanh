import site from "@/site.config.mjs";

// Cho phép khách "Thêm vào màn hình chính" trên điện thoại: mở web như một ứng dụng, có icon riêng.
export default function manifest() {
  return {
    name: `${site.name} – ${site.slogan}`,
    short_name: site.name,
    description: `Sửa ô tô tận nơi tại ${site.city}.`,
    start_url: "/",
    display: "standalone",
    background_color: "#13283f",
    theme_color: "#13283f",
    lang: "vi",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
