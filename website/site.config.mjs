// Mọi thông tin thương hiệu nằm ở đây. Đổi tên, hotline, Zalo... chỉ cần sửa file này.
import * as mau from "./mock/du-lieu-mau.mjs";

const allowIndex = process.env.ALLOW_INDEX === "1";
// Dữ liệu mẫu (mock/du-lieu-mau.mjs): bật khi chạy thử, TỰ TẮT khi gắn tên miền thật (ALLOW_INDEX=1). Tắt tay: DU_LIEU_MAU=0.
const mock = !allowIndex && process.env.DU_LIEU_MAU !== "0";

const site = {
  name: "VC Mobile Care",
  slogan: "Xe dừng đâu, thợ tới đó",
  parent: "VC Phồn Vinh",
  city: "Hà Nội",
  // Điền số chính thức vào đây. Để trống: chạy thử thì dùng số mẫu, chạy thật thì nút hiện "Sắp có".
  hotline: "",
  zalo: "", // ví dụ "https://zalo.me/<id OA>"
  email: "",
  // Các quận đang phục vụ (đợt 1). Để trống thì ghi "Hà Nội".
  serviceAreas: [],
  partnerWorkshop: "xưởng Auto Speedy",
  // Cam kết hiện thành huy hiệu ở trang chủ, trang dịch vụ, trang đặt lịch.
  // Chỉ ghi điều công ty thực sự làm được (đã được duyệt 12/10/2026).
  camKet: [
    { icon: "receipt", tieuDe: "Báo giá trước, sửa sau", moTa: "Báo rõ tiền công và phụ tùng. Bạn đồng ý thợ mới làm." },
    { icon: "shield", tieuDe: "Bảo hành 6 tháng", moTa: "Cho phụ tùng và công thay tại chỗ." },
    { icon: "check", tieuDe: "Không sửa được, không lấy tiền", moTa: "Thợ không xử lý được thì không thu tiền công." },
    { icon: "box", tieuDe: "Phụ tùng VCparts", moTa: "Rõ nguồn gốc, đúng mã cho từng dòng xe." },
    { icon: "sparkle", tieuDe: "Giữ sạch xe", moTa: "Lót ghế, trải thảm, dọn sạch chỗ làm." },
    { icon: "tow", tieuDe: "Có xưởng đỡ lưng", moTa: "Ca phức tạp kéo về xưởng Auto Speedy." },
  ],
  // Địa chỉ website. Chưa có tên miền thì Cloudflare Pages cấp dạng https://<tên>.pages.dev
  url: process.env.SITE_URL || "https://vc-mobile-care.pages.dev",
  // Chỉ bật khi đã gắn tên miền thật: ALLOW_INDEX=1 trong cài đặt Cloudflare Pages.
  allowIndex,
  // Nơi nhận form đặt lịch (API của VCsoft). Để trống: chạy thử dùng API giả trong trình duyệt (lib/api.js), chạy thật thì form chuyển sang gọi/Zalo.
  bookingEndpoint: process.env.NEXT_PUBLIC_BOOKING_ENDPOINT || "",
  // Nơi tra cứu lệnh sửa chữa (API của VCgarage). Để trống: chạy thử dùng API giả, chạy thật thì hướng dẫn gọi hotline.
  trackingEndpoint: process.env.NEXT_PUBLIC_TRACKING_ENDPOINT || "",
  mock,
};

// Ô nào chưa có dữ liệu thật thì lấy dữ liệu mẫu (chỉ khi đang chạy thử).
if (mock) for (const [k, v] of Object.entries(mau.lienHe)) if (!site[k] || (Array.isArray(site[k]) && !site[k].length)) site[k] = v;

export default site;
