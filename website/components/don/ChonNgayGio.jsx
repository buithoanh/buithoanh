"use client";
// Chọn ngày (4 cột) và khung giờ (2 cột). lich: kết quả GET /api/lich-dat/khung-gio (.ngay).
// Khung đầy, đã qua hoặc ngày nghỉ thì khoá (gạch ngang), không chọn được.
import NutChon from "./NutChon";
import s from "./ChonNgayGio.module.css";

export const datDuoc = (k) => k && (k.datDuoc ?? (!k.day && !k.daQua));

export default function ChonNgayGio({ lich, ngay, khung, onChonNgay, onChonKhung, loi, dangTai }) {
  const ngayChon = lich.find((n) => n.ngay === ngay);
  return (
    <div className={s.khung}>
      <div className={s.ngay} role="group" aria-label="Chọn ngày">
        {lich.map((n) => {
          const conKhung = !n.nghi && n.khung.some(datDuoc);
          return (
            <NutChon key={n.ngay} chon={n.ngay === ngay} khoa={!conKhung} onClick={() => onChonNgay(n.ngay)}
              aria-label={`${n.nhan} ${n.ngayThang}${n.nghi ? ", nghỉ" : !conKhung ? ", hết chỗ" : ""}`}>
              <span className={s.thu}>{n.nhan}</span><b className={s.dd}>{n.ngayThang}</b>
            </NutChon>
          );
        })}
      </div>
      {ngayChon?.nghi ? <p className="bao bao-vang">Ngày này nghỉ, chọn ngày khác.</p> : null}
      <div className={s.gio} role="group" aria-label="Chọn khung giờ" aria-busy={dangTai ? "true" : undefined} aria-describedby={loi ? "khungGio-loi" : undefined}>
        {(ngayChon?.khung || []).map((k) => {
          const duoc = !ngayChon.nghi && datDuoc(k);
          const ly = k.day ? "đã đầy" : k.daQua ? "đã qua" : ngayChon.nghi ? "nghỉ" : "";
          return (
            <NutChon key={k.ma} chon={duoc && k.ma === khung} khoa={!duoc} onClick={() => onChonKhung(k.ma)}
              aria-label={`${k.nhan}${ly ? `, ${ly}` : ""}`}>
              {k.nhan}
            </NutChon>
          );
        })}
      </div>
      {loi ? <span id="khungGio-loi" className={s.loi} role="alert">{loi}</span> : null}
    </div>
  );
}
