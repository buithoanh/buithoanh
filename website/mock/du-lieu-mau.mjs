// DỮ LIỆU MẪU cho giai đoạn phát triển: số điện thoại, giá, kỹ thuật viên, đánh giá, lệnh sửa chữa đều là GIẢ.
// Bật mặc định khi chạy thử; tự tắt khi gắn tên miền thật (ALLOW_INDEX=1). Tắt tay: DU_LIEU_MAU=0.
// Khi có dữ liệu thật: điền vào site.config.mjs / content/ — dữ liệu thật luôn được ưu tiên hơn dữ liệu mẫu.

export const lienHe = {
  hotline: "0900 000 000",
  zalo: "https://zalo.me/0900000000",
  email: "lienhe@vcmobilecare.vn",
  serviceAreas: ["Cầu Giấy", "Đống Đa", "Ba Đình", "Thanh Xuân", "Nam Từ Liêm", "Hai Bà Trưng"],
};

// Giá "từ ..." theo slug trang dịch vụ.
export const gia = {
  "bao-duong-dinh-ky": "450.000đ",
  "ac-quy": "1.150.000đ",
  lop: "120.000đ",
  "doc-loi-chan-doan": "200.000đ",
  phanh: "350.000đ",
  "cuu-ho-keo-xe": "500.000đ",
};

export const soLieu = { diem: "4,9", soDanhGia: 326, luotSua: "1.200+", phutToi: 25 };

export const kyThuatVien = [
  {
    slug: "nguyen-van-hung", ten: "Nguyễn Văn Hùng", anh: "/mau/ktv-1.svg", chucDanh: "Trưởng nhóm kỹ thuật", namKinhNghiem: 12,
    chuyenMon: ["Chẩn đoán OBD", "Điện ô tô", "Toyota, Honda"], chungChi: ["Thợ sửa chữa ô tô bậc 4/7", "Chẩn đoán Bosch KTS"], bienSo: "30H-218.47",
    gioiThieu: "12 năm ở xưởng dịch vụ chính hãng trước khi đi sửa lưu động. Chuyên bắt bệnh lỗi điện và đèn check engine.",
  },
  {
    slug: "tran-minh-duc", ten: "Trần Minh Đức", anh: "/mau/ktv-2.svg", chucDanh: "Kỹ thuật viên điện – ắc quy", namKinhNghiem: 8,
    chuyenMon: ["Ắc quy", "Hệ thống khởi động", "Start-stop"], chungChi: ["Lắp đặt ắc quy AGM/EFB"], bienSo: "30H-305.12",
    gioiThieu: "Xử lý hơn 2.000 ca xe không nổ máy. Thay ắc quy có giữ nguồn, không mất cài đặt xe.",
  },
  {
    slug: "le-quang-huy", ten: "Lê Quang Huy", anh: "/mau/ktv-3.svg", chucDanh: "Kỹ thuật viên lốp – phanh", namKinhNghiem: 6,
    chuyenMon: ["Lốp", "Phanh", "Phanh tay điện tử"], chungChi: ["An toàn hệ thống phanh"], bienSo: "30H-417.90",
    gioiThieu: "Vá lốp, thay má phanh tại chỗ trong khoảng 30–45 phút. Quen làm xe điện VinFast.",
  },
  {
    slug: "pham-thu-lan", ten: "Phạm Thu Lan", anh: "/mau/ktv-4.svg", chucDanh: "Kỹ thuật viên bảo dưỡng", namKinhNghiem: 5,
    chuyenMon: ["Bảo dưỡng định kỳ", "Dầu, lọc", "Điều hoà"], chungChi: ["Bảo dưỡng theo tiêu chuẩn hãng"], bienSo: "30H-522.36",
    gioiThieu: "Tỉ mỉ, có checklist 30 hạng mục cho mỗi lần bảo dưỡng và chụp ảnh gửi khách trước – sau.",
  },
];

export const danhGia = [
  { ten: "Anh Tuấn", xe: "Mazda CX-5 2020", khuVuc: "Cầu Giấy", dichVu: "ac-quy", sao: 5, ngay: "28/09/2026", noiDung: "Sáng 6h xe không nổ, gọi 25 phút là thợ tới. Báo giá trước, thay bình xong còn kiểm tra máy phát giúp. Đi làm không muộn." },
  { ten: "Chị Hạnh", xe: "Honda City 2021", khuVuc: "Đống Đa", dichVu: "bao-duong-dinh-ky", sao: 5, ngay: "21/09/2026", noiDung: "Bảo dưỡng ngay dưới hầm chung cư, có lót ghế, trải thảm. Thợ chụp ảnh dầu cũ và lọc gửi Zalo, rất yên tâm." },
  { ten: "Anh Minh", xe: "VinFast VF 8", khuVuc: "Nam Từ Liêm", dichVu: "lop", sao: 5, ngay: "15/09/2026", noiDung: "Thủng lốp trên đường Phạm Hùng, thợ tới vá tại chỗ, bơm đúng áp suất. Giá đúng như báo qua điện thoại." },
  { ten: "Anh Dũng", xe: "Toyota Innova 2018", khuVuc: "Thanh Xuân", dichVu: "doc-loi-chan-doan", sao: 4, ngay: "09/09/2026", noiDung: "Đèn check engine sáng, thợ đọc lỗi và giải thích rõ là cảm biến oxy. Hẹn hôm sau thay vì phải đặt phụ tùng." },
  { ten: "Chị Ngọc", xe: "Kia Morning 2019", khuVuc: "Ba Đình", dichVu: "phanh", sao: 5, ngay: "02/09/2026", noiDung: "Phanh kêu rít mấy tuần, thợ thay má phanh trước trong 40 phút ngay trước cửa nhà. Hết kêu hẳn." },
  { ten: "Anh Khoa", xe: "Ford Ranger 2017", khuVuc: "Hai Bà Trưng", dichVu: "cuu-ho-keo-xe", sao: 5, ngay: "26/08/2026", noiDung: "Xe chết máy giữa đường, không sửa tại chỗ được nên kéo về xưởng Auto Speedy. Có người theo dõi, báo tình trạng liên tục." },
];

// Lệnh sửa chữa mẫu cho trang tra cứu. Lệnh khách tự đặt khi chạy thử được lưu trong trình duyệt (xem lib/api.js).
export const lenhMau = [
  {
    sdt: "0912345678", ma: "VC-2401", dichVu: "Thay ắc quy", xe: "Toyota Vios 2019 · 30A-567.89", trangThai: "dang-toi", duKienPhut: 12,
    ktv: { ten: "Trần Minh Đức", anh: "/mau/ktv-2.svg", chuyenMon: "Điện – ắc quy", bienSo: "30H-305.12", sdt: "0900 000 000" },
    lichSu: [{ trangThai: "tiep-nhan", luc: "07:42 · Đã báo giá 1.150.000đ, bạn đồng ý" }, { trangThai: "dang-toi", luc: "07:48 · Xuất phát từ Cầu Giấy" }],
  },
  {
    sdt: "0987654321", ma: "VC-2398", dichVu: "Bảo dưỡng định kỳ", xe: "Honda CR-V 2022 · 30K-112.08", trangThai: "dang-sua",
    ktv: { ten: "Phạm Thu Lan", anh: "/mau/ktv-4.svg", chuyenMon: "Bảo dưỡng", bienSo: "30H-522.36", sdt: "0900 000 000" },
    lichSu: [{ trangThai: "tiep-nhan", luc: "08:05 · Đã báo giá, bạn đồng ý" }, { trangThai: "dang-toi", luc: "08:10 · Xuất phát" }, { trangThai: "dang-sua", luc: "08:41 · Bắt đầu thay dầu, lọc" }],
  },
  {
    sdt: "0901234567", ma: "VC-2385", dichVu: "Vá và thay lốp", xe: "VinFast VF 8 · 30G-889.21", trangThai: "da-thanh-toan", tongTien: "180.000đ",
    ktv: { ten: "Lê Quang Huy", anh: "/mau/ktv-3.svg", chuyenMon: "Lốp – phanh", bienSo: "30H-417.90" },
    lichSu: [
      { trangThai: "tiep-nhan", luc: "Hôm qua 16:20 · Đã báo giá" }, { trangThai: "dang-toi", luc: "16:24 · Xuất phát" },
      { trangThai: "dang-sua", luc: "16:51 · Vá lốp trước phải" }, { trangThai: "hoan-tat", luc: "17:12 · Bàn giao, kiểm tra áp suất 4 lốp" },
      { trangThai: "da-thanh-toan", luc: "17:14 · VietQR, đã gửi hoá đơn điện tử" },
    ],
  },
];
