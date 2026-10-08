// Ánh xạ ảnh minh hoạ theo slug dịch vụ. Ảnh tạm (SVG tự vẽ) nằm trong public/anh/tam/, xem NGUON.md.
// Khi có ảnh thật của đội: đặt file vào public/anh/ rồi đổi `src` (và width/height) ở đây.
const W = 800;
const H = 600;

export const anhTrangChu = {
  src: "/anh/tam/xe-van-dich-vu.svg",
  alt: "Minh hoạ xe van dịch vụ ThợTới đỗ cạnh ô tô bị hỏng bên đường, thợ đang tới kiểm tra",
  width: W,
  height: H,
};

const theoDichVu = {
  "ac-quy": { src: "/anh/tam/ac-quy.svg", alt: "Minh hoạ ắc quy ô tô với dây câu bình kẹp vào cọc dương và cọc âm" },
  lop: { src: "/anh/tam/lop.svg", alt: "Minh hoạ lốp ô tô bị đinh đâm, đồng hồ đo áp suất lốp và tay vặn ốc bánh xe" },
  "doc-loi-chan-doan": { src: "/anh/tam/doc-loi.svg", alt: "Minh hoạ bảng đồng hồ sáng đèn check engine và máy đọc lỗi OBD cầm tay" },
  phanh: { src: "/anh/tam/phanh.svg", alt: "Minh hoạ đĩa phanh ô tô, cùm phanh màu cam và má phanh đã tháo" },
  "cuu-ho-keo-xe": { src: "/anh/tam/cuu-ho.svg", alt: "Minh hoạ xe cứu hộ sàn chở ô tô hỏng về xưởng sửa chữa" },
  "bao-duong-dinh-ky": { src: "/anh/tam/bao-duong.svg", alt: "Minh hoạ can dầu máy, lọc dầu và cờ lê dùng khi bảo dưỡng định kỳ" },
};

export function anhDichVu(slug) {
  const a = theoDichVu[slug];
  return a ? { width: W, height: H, ...a } : { ...anhTrangChu };
}
