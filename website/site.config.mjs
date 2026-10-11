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
  // Cam kết hiện thành huy hiệu ở trang chủ, trang dịch vụ, trang đặt lịch.
  // Chỉ ghi điều công ty thực sự làm được. Khi chốt chính sách bảo hành, thêm một dòng, ví dụ:
  // { icon: "shield", tieuDe: "Bảo hành 6 tháng", moTa: "Cho phụ tùng thay tại chỗ." },
  camKet: [
    { icon: "receipt", tieuDe: "Báo giá trước, sửa sau", moTa: "Báo rõ tiền công và phụ tùng. Bạn đồng ý thợ mới làm." },
    { icon: "box", tieuDe: "Phụ tùng VCparts", moTa: "Rõ nguồn gốc, đúng mã cho từng dòng xe." },
    { icon: "sparkle", tieuDe: "Giữ sạch xe", moTa: "Lót ghế, trải thảm, dọn sạch chỗ làm." },
    { icon: "tow", tieuDe: "Có xưởng đỡ lưng", moTa: "Ca phức tạp kéo về xưởng Auto Speedy." },
  ],
  // Địa chỉ website. Chưa có tên miền thì Cloudflare Pages cấp dạng https://<tên>.pages.dev
  url: process.env.SITE_URL || "https://vc-mobile-care.pages.dev",
  // Chỉ bật khi đã gắn tên miền thật: ALLOW_INDEX=1 trong cài đặt Cloudflare Pages.
  allowIndex: process.env.ALLOW_INDEX === "1",
  // Nơi nhận form đặt lịch (API của VCsoft). Để trống thì form chuyển sang gọi/Zalo.
  bookingEndpoint: process.env.NEXT_PUBLIC_BOOKING_ENDPOINT || "",
  // Nơi tra cứu lệnh sửa chữa (API của VCgarage). Để trống thì trang tra cứu hướng dẫn gọi hotline.
  trackingEndpoint: process.env.NEXT_PUBLIC_TRACKING_ENDPOINT || "",
};

export default site;
