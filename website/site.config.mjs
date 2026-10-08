// Mọi thông tin thương hiệu nằm ở đây. Đổi tên, hotline, Zalo... chỉ cần sửa file này.
const site = {
  name: "VC Mobile Care",
  slogan: "Xe dừng đâu, thợ tới đó",
  parent: "VC Phồn Vinh",
  city: "Hà Nội",
  // TODO: điền khi có số chính thức. Đang để trống thì nút gọi/Zalo hiện "Sắp có".
  hotline: "",
  zalo: "", // ví dụ "https://zalo.me/<id OA>"
  email: "",
  // Các quận đang phục vụ (đợt 1). Để trống thì ghi "Hà Nội".
  serviceAreas: [],
  partnerWorkshop: "xưởng Auto Speedy",
  // Địa chỉ website. Chưa có tên miền thì Cloudflare Pages cấp dạng https://<tên>.pages.dev
  url: process.env.SITE_URL || "https://vc-mobile-care.pages.dev",
  // Chỉ bật khi đã gắn tên miền thật: ALLOW_INDEX=1 trong cài đặt Cloudflare Pages.
  allowIndex: process.env.ALLOW_INDEX === "1",
  // Nơi nhận form đặt lịch (API của VCsoft). Để trống thì form chuyển sang gọi/Zalo.
  bookingEndpoint: process.env.NEXT_PUBLIC_BOOKING_ENDPOINT || "",
  // Repo GitHub chứa website. Trang quản trị (/quan-tri/) dùng để mở trình sửa bài và tạo bài mới.
  repo: "buithoanh/buithoanh",
  repoBranch: "main",
};

export default site;
