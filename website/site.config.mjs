// Mọi thông tin thương hiệu nằm ở đây. Đổi tên, hotline, Zalo... chỉ cần sửa file này.
// Hotline, Zalo, email, quận phục vụ, xưởng đối tác nằm trong content/thong-tin.json
// để sửa được từ trang quản trị (/quan-tri/bai-viet/ → Thông tin liên hệ).
import info from "./content/thong-tin.json" with { type: "json" };

const site = {
  name: "VC Mobile Care",
  slogan: "Xe dừng đâu, thợ tới đó",
  parent: "VC Phồn Vinh",
  city: "Hà Nội",
  // Để trống hotline/Zalo thì nút gọi/Zalo hiện "Sắp có". Không có quận nào thì ghi "Hà Nội".
  hotline: info.hotline || "",
  zalo: info.zalo || "", // ví dụ "https://zalo.me/<id OA>"
  email: info.email || "",
  serviceAreas: info.serviceAreas || [],
  partnerWorkshop: info.partnerWorkshop || "xưởng đối tác",
  // Địa chỉ website. Chưa có tên miền thì Cloudflare Pages cấp dạng https://<tên>.pages.dev
  url: process.env.SITE_URL || "https://vc-mobile-care.pages.dev",
  // Chỉ bật khi đã gắn tên miền thật: ALLOW_INDEX=1 trong cài đặt Cloudflare Pages.
  allowIndex: process.env.ALLOW_INDEX === "1",
  // Nơi nhận form đặt lịch. Mặc định là /api/dat-lich (lưu vào Cloudflare D1, xem ở /quan-tri/lich-hen/).
  // Khi VCsoft có API nhận lịch thì đặt NEXT_PUBLIC_BOOKING_ENDPOINT để gửi thẳng sang đó.
  bookingEndpoint: process.env.NEXT_PUBLIC_BOOKING_ENDPOINT || "/api/dat-lich",
  // Repo GitHub chứa website. Trang quản trị (/quan-tri/) dùng để mở trình sửa bài và tạo bài mới.
  repo: "buithoanh/buithoanh",
  repoBranch: "main",
};

export default site;
