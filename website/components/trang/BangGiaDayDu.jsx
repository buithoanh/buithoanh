"use client";
// Bảng giá đầy đủ theo dịch vụ (màn BangGia): chọn phân khúc A–D (hoặc tra theo hãng/dòng xe) → giá phụ tùng đổi theo.
// dichVu: layBangGia().dichVu (mỗi hạng mục phụ tùng có giaTheoPhanKhuc đủ 4 phân khúc). Không gọi API khi đổi phân khúc.
// Mỗi dịch vụ là <details> nên đọc được cả khi tắt JavaScript. Agent khác dùng lại được (vd nhúng trong trang khác).
import Link from "next/link";
import { useState } from "react";
import ChonXe from "../chung/ChonXe";
import BangGiaHangMuc, { ChanBang } from "./BangGiaHangMuc";
import ChonPhanKhuc from "./ChonPhanKhuc";
import s from "./BangGiaDayDu.module.css";

export function hangMucTheoPhanKhuc(hangMuc, pk) {
  return hangMuc.map((h) => (h.loai === "phuTung" && pk && h.giaTheoPhanKhuc
    ? { ...h, giaHienThi: h.giaTheoPhanKhuc[pk].hienThi, loaiNhan: `Phụ tùng · giá xe phân khúc ${pk}` }
    : h));
}

export default function BangGiaDayDu({ phanKhuc, phanKhucBanDau = "B", dichVu, moSan = 1 }) {
  const [pk, setPk] = useState(phanKhucBanDau);
  const [traXe, setTraXe] = useState(false);
  const [xe, setXe] = useState("");
  const info = phanKhuc.find((p) => p.ma === pk);

  const doiPk = (ma) => {
    setPk(ma);
    try {
      const u = new URL(location.href);
      u.searchParams.set("phanKhuc", ma);
      history.replaceState(null, "", u);
    } catch { /* bỏ qua */ }
  };

  return (
    <>
      <section className="khoi" aria-labelledby="chon-pk">
        <div>
          <h2 id="chon-pk" className={s.h2}>Xe của bạn thuộc cỡ nào?</h2>
          <p className="phu">Chọn cỡ xe, giá phụ tùng bên dưới đổi theo.</p>
        </div>
        <ChonPhanKhuc phanKhuc={phanKhuc} giaTri={pk} onChange={doiPk} />
        {info ? (
          <p className={s.moTaPk} aria-live="polite">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
            <span><b>Phân khúc {pk}:</b> {info.moTa}{xe ? ` · ${xe}` : ""}</span>
          </p>
        ) : null}
        <button type="button" className={s.traXe} aria-expanded={traXe} onClick={() => setTraXe(!traXe)}>
          Không rõ xe mình cỡ nào? Tra theo hãng xe →
        </button>
        {traXe ? (
          <div className={s.khungTra}>
            <ChonXe idTien="bang-gia" hienDoi={false} onChange={(x) => { if (x.phanKhuc) { doiPk(x.phanKhuc); setXe(x.tenXe); } }} />
          </div>
        ) : null}
      </section>

      <section className="khoi" aria-labelledby="gia-dv">
        <div className="khoi-tieu-de">
          <h2 id="gia-dv" className={s.h2}>Giá theo dịch vụ</h2>
          <span className="phu nho">Chạm để mở</span>
        </div>
        <div className={s.chuGiai}>
          <span><span className={s.chamCong} aria-hidden="true" />Tiền công (cố định)</span>
          <span><span className={s.chamPt} aria-hidden="true" />Phụ tùng (khoảng giá)</span>
        </div>
        <div className={s.ds}>
          {dichVu.map((d, i) => (
            <details key={d.slug} className={s.dv} open={i < moSan} id={`gia-${d.slug}`}>
              <summary>
                <span className={s.ma} aria-hidden="true">{d.ma}</span>
                <span className={s.ten}><b>{d.ten}</b><span>{d.tomTat}</span></span>
                <svg className={s.mui} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              </summary>
              <BangGiaHangMuc
                className={s.bang} hangMuc={hangMucTheoPhanKhuc(d.hangMuc, pk)} hienLoai chamMau tieuDe={`Giá ${d.ten}, phân khúc ${pk}`}
                cuoi={(
                  <ChanBang className={s.chan}>
                    {d.ghiChuBangGia ? <span>{d.ghiChuBangGia}</span> : null}
                    {d.nhanDatLich ? <Link href={`/dat-lich/?dv=${d.slug}`} className={`link-nhan ${s.cta}`}>{d.nutKeuGoi || `Đặt lịch ${d.ten.toLowerCase()}`} →</Link> : null}
                  </ChanBang>
                )}
              />
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
