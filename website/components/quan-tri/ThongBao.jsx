"use client";
// Dải thông báo kết quả (đã lưu / lỗi / thông tin) có nút đóng. role="status" để trình đọc màn hình đọc ngay.
import IconQt from "./IconQt";
import s from "./qt.module.css";

const LOP = { ok: s.tbOk, loi: s.tbLoi, tin: s.tbTin };
const ICON = { ok: "dung", loi: "canh-bao", tin: "thong-tin" };

export default function ThongBao({ tb, onDong }) {
  if (!tb?.chu) return null;
  return (
    <div role={tb.loai === "loi" ? "alert" : "status"} className={`${s.thongBao} ${LOP[tb.loai] || s.tbTin}`}>
      <IconQt name={ICON[tb.loai] || "thong-tin"} size={20} />
      <span>{tb.chu}</span>
      {onDong ? <button type="button" className={s.dongTB} aria-label="Đóng thông báo" onClick={onDong}>×</button> : null}
    </div>
  );
}
