// Câu tóm tắt quyền lợi gói hội viên từ số liệu gói (layTrangHoiVien().goi[].quyenLoi): null = không giới hạn, 0 = không có.
export function tomTatGoi(q) {
  if (!q) return "";
  const phan = [];
  const luot = (n, ten, kVoHan) => {
    if (n === null) phan.push(kVoHan);
    else if (n > 0) phan.push(`${ten} ${n} lần`);
  };
  luot(q.mienDiLaiSoLan, "miễn phí đi lại", "miễn phí đi lại không giới hạn");
  luot(q.mienKichNoSoLan, "kích nổ", "kích nổ miễn phí");
  luot(q.mienVaLopSoLan, "vá lốp", "vá lốp miễn phí");
  if (q.giamCongPhanTram) phan.push(`giảm ${q.giamCongPhanTram}% tiền công`);
  const cau = phan.join(", ");
  return cau ? cau[0].toUpperCase() + cau.slice(1) + "." : "";
}
