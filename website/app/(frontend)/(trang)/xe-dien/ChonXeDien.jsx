"use client";
// Chọn dòng xe điện → giá phụ tùng theo phân khúc của dòng đó (giá đủ 4 phân khúc có sẵn từ server).
import { useState } from "react";
import BangGiaHangMuc from "@/components/trang/BangGiaHangMuc";
import KhoiCta from "@/components/trang/KhoiCta";
import s from "./xe-dien.module.css";

// giua: phần server render (việc không làm, khối taxi, hỏi nhanh) đặt giữa bảng giá và khối "Xe đã chọn sẵn".
export default function ChonXeDien({ dong, dichVu, phi, cuuHoPhut, giua = null }) {
  const [slug, setSlug] = useState(dong.find((d) => d.phanKhuc === "B")?.slug || dong[0].slug);
  const cur = dong.find((d) => d.slug === slug) || dong[0];
  const pk = cur.phanKhuc;
  const tenXe = cur.tenDayDu || `${cur.tenHang} ${cur.ten}`;
  return (
    <>
      <section className="khoi" aria-labelledby="xe-cua-ban">
        <div>
          <h2 id="xe-cua-ban" className={s.h2}>Xe của bạn</h2>
          <p className="phu">Chọn dòng xe để xem đúng giá phụ tùng.</p>
        </div>
        <div role="group" aria-label="Dòng xe điện" className={s.dong}>
          {dong.map((d) => (
            <button key={d.slug} type="button" aria-pressed={d.slug === cur.slug} onClick={() => setSlug(d.slug)} className={`${s.oDong} ${d.slug === cur.slug ? s.chon : ""}`}>{d.ten}</button>
          ))}
        </div>
      </section>

      <section className="khoi" aria-labelledby="viec-lam" aria-live="polite">
        <div className={s.dauMuc}>
          <span className={`${s.icon} ${s.iconCo}`} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
          </span>
          <h2 id="viec-lam" className={s.h2}>Việc chúng tôi làm</h2>
        </div>
        <div className={s.luoiViec}>
          {dichVu.map((d) => (
            <div key={d.slug} className={s.viec}>
              <div className={s.viecDau}><b>{d.ten}</b>{d.moTaNgan ? <span>{d.moTaNgan}</span> : null}</div>
              <BangGiaHangMuc
                className={s.bangViec} tieuDe={`Giá ${d.ten} ${tenXe}`}
                hangMuc={d.hangMuc.map((h) => (h.loai === "phuTung" && pk && h.giaTheoPhanKhuc ? { ...h, giaHienThi: h.giaTheoPhanKhuc[pk].hienThi } : h))}
              />
            </div>
          ))}
        </div>
        <span className="phu nho">
          Cộng phí đi lại nội thành {phi.hienThi.phiDiLai}. Giá công cố định; giá phụ tùng theo {tenXe}{pk ? ` (phân khúc ${pk})` : ""}, thợ báo giá chính thức trước khi làm.
        </span>
      </section>

      {giua}
      <KhoiCta
        nhan="Xe đã chọn sẵn" tieuDe={tenXe}
        moTa={cuuHoPhut ? `Thợ có mặt trong ${cuuHoPhut} phút khi cứu hộ trong vùng phục vụ.` : "Thợ tới tận nơi xe đỗ, báo giá trước khi làm."}
        href={`/dat-lich/?hang=${cur.hang}&dong=${cur.slug}`} chuNut={`Đặt lịch cho ${tenXe}`}
      />
    </>
  );
}
