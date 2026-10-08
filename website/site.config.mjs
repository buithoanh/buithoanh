// Thông tin cố định của thương hiệu. Hotline, Zalo, pháp nhân, quận phục vụ… sửa trong trang admin
// (Hệ thống → Cấu hình chung); các giá trị dưới đây chỉ dùng khi admin chưa điền.
const site = {
  name: "ThợTới",
  // Dòng phụ đi kèm tên thương hiệu
  tagline: "by VC Phồn Vinh",
  slogan: "Xe dừng đâu, thợ tới đó",
  parent: "VC Phồn Vinh",
  city: "Hà Nội",
  partnerWorkshop: "xưởng Auto Speedy",
  // Địa chỉ website (không có dấu / ở cuối).
  url: process.env.SITE_URL || "http://localhost:3000",
  // Chỉ bật khi đã gắn tên miền thật: ALLOW_INDEX=1.
  allowIndex: process.env.ALLOW_INDEX === "1",
  // Nơi nhận form đặt lịch. Mặc định là API của chính web này (đơn hiện trong admin).
  bookingEndpoint: process.env.NEXT_PUBLIC_BOOKING_ENDPOINT || "/api/don-hang/dat-lich",
};

export default site;
