"use client";
// Phần tương tác của trang hãng xe: chọn dòng, đời → bảng giá bảo dưỡng, lỗi hay gặp, phụ tùng, nút đặt lịch đổi theo.
// Giá đủ 4 phân khúc đã có sẵn từ server (giaTheoPhanKhuc), đổi dòng xe không phải gọi API.
import Link from "next/link";
import { useMemo, useState } from "react";
import BangGiaHangMuc from "@/components/trang/BangGiaHangMuc";
import KhoiCta from "@/components/trang/KhoiCta";
import s from "./chon-dong-xe.module.css";

const NAM_NAY = new Date().getFullYear();

function nhomDoi(d) {
  if (!d.doiTu) return [{ nhan: "Mọi đời", tu: null, den: null }];
  const y0 = d.doiTu;
  const y1 = Math.max(d.doiDen || NAM_NAY, y0);
  const soNam = y1 - y0 + 1;
  if (soNam <= 5) return [{ nhan: `${y0}–${y1}`, tu: y0, den: y1 }];
  const buoc = Math.ceil(soNam / 3);
  return [[y0, y0 + buoc - 1], [y0 + buoc, y0 + 2 * buoc - 1], [y0 + 2 * buoc, y1]]
    .filter(([a, b]) => a <= b).map(([a, b]) => ({ nhan: a === b ? `${a}` : `${a}–${b}`, tu: a, den: b }));
}

const ngayVN = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }) : "");

export default function ChonDongXe({ hang, dongBanDau, phanKhuc, dichVu, phi, uocTinh, phuTung, benh, capNhat, baoHanh }) {
  const [dongSlug, setDongSlug] = useState(hang.dong.some((d) => d.slug === dongBanDau) ? dongBanDau : hang.dong[0].slug);
  const [iDoi, setIDoi] = useState(null);
  const cur = hang.dong.find((d) => d.slug === dongSlug) || hang.dong[0];
  const cacDoi = useMemo(() => nhomDoi(cur), [cur]);
  const doi = cacDoi[iDoi == null ? cacDoi.length - 1 : Math.min(iDoi, cacDoi.length - 1)];
  const pk = cur.phanKhuc;
  const pkInfo = phanKhuc.find((p) => p.ma === pk);
  const tenXe = `${hang.ten} ${cur.ten}${doi.tu ? ` ${doi.nhan}` : ""}`;

  const chonDong = (slug) => {
    setDongSlug(slug);
    setIDoi(null);
    try {
      const u = new URL(location.href);
      u.searchParams.set("dong", slug);
      history.replaceState(null, "", u);
    } catch { /* bỏ qua */ }
  };

  const hangMuc = dichVu ? [
    ...dichVu.hangMuc.map((h) => (h.loai === "phuTung" && pk && h.giaTheoPhanKhuc
      ? { ...h, giaHienThi: h.giaTheoPhanKhuc[pk].hienThi, loaiNhan: `Phụ tùng · phân khúc ${pk}` }
      : h)),
    { id: "phi-di-lai", ten: "Phí đi lại nội thành", loai: "phi", loaiNhan: "Trong vùng phục vụ", giaHienThi: phi.hienThi.phiDiLai },
  ] : [];
  const benhCuaDong = benh.filter((b) => !b.dong || b.dong === cur.slug);
  const q = new URLSearchParams({ ...(dichVu ? { dv: dichVu.slug } : {}), hang: hang.slug, dong: cur.slug });

  return (
    <>
      <section className="khoi" aria-labelledby="chon-dong">
        <div>
          <h2 id="chon-dong" className={s.h2}>Xe {hang.ten} của bạn là dòng nào?</h2>
          <p className="phu">Bấm chọn, bảng giá bên dưới đổi theo.</p>
        </div>
        <div role="group" aria-label="Dòng xe" className={s.dong}>
          {hang.dong.map((d) => (
            <button key={d.slug} type="button" aria-pressed={d.slug === cur.slug} onClick={() => chonDong(d.slug)} className={`${s.oDong} ${d.slug === cur.slug ? s.chon : ""}`}>
              <b>{d.ten}</b>
              <span>{[d.doiTu ? `Đời ${d.doiTu}–${d.doiDen || NAM_NAY}` : null, d.phanKhuc ? `hạng ${d.phanKhuc}` : null].filter(Boolean).join(" · ")}</span>
            </button>
          ))}
        </div>
        {cacDoi.length > 1 || cacDoi[0].tu ? (
          <>
            <span className={s.nhanDoi} id="nhan-doi">Đời xe</span>
            <div role="group" aria-labelledby="nhan-doi" className={s.doi}>
              {cacDoi.map((g, i) => (
                <button key={g.nhan} type="button" aria-pressed={g === doi} onClick={() => setIDoi(i)} className={`${s.oDoi} ${g === doi ? s.chonDoi : ""}`}>{g.nhan}</button>
              ))}
            </div>
          </>
        ) : null}
      </section>

      {dichVu ? (
        <section className="khoi" aria-labelledby="gia-xe" aria-live="polite">
          <div className={s.dauGia}>
            <h2 id="gia-xe" className={s.h2}>Giá {dichVu.ten.toLowerCase()} {tenXe}</h2>
            <span className="phu nho">
              {pkInfo ? `Phân khúc ${pk} · ${pkInfo.moTa} · giá áp dụng cho mọi đời trong phân khúc` : "Dòng xe này đang được xếp phân khúc: giá phụ tùng hiện theo khoảng chung."}
            </span>
          </div>
          <BangGiaHangMuc
            hangMuc={hangMuc} dau="nhat" hienLoai tieuDe={`Giá ${dichVu.ten} ${tenXe}`}
            cuoi={(
              <>
                {pk && uocTinh[pk] ? (
                  <div className={s.goiY}>
                    <span className={s.goiYTieuDe}>Giá sơ bộ cho {cur.ten}{doi.tu ? ` đời ${doi.nhan}` : ""}</span>
                    <div><span>{dichVu.ten}, đã gồm phí đi lại</span><b>{uocTinh[pk]}</b></div>
                  </div>
                ) : null}
                <div className={s.chan}>
                  Giá công cố định. Giá phụ tùng theo dòng xe, thợ báo giá chính thức trước khi làm.
                  {capNhat ? ` Giá lấy từ bảng giá chung, cập nhật ${ngayVN(capNhat)}.` : " Giá lấy từ bảng giá chung."}
                </div>
              </>
            )}
          />
          <Link href={`/bang-gia/${pk ? `?phanKhuc=${pk}` : ""}`} className="link-nhan nho">Xem bảng giá đầy đủ →</Link>
        </section>
      ) : null}

      {benhCuaDong.length ? (
        <section className="khoi" aria-labelledby="loi-hay-gap">
          <h2 id="loi-hay-gap" className={s.h2}>Lỗi hay gặp ở xe {hang.ten}</h2>
          <ul className={s.benh}>
            {benhCuaDong.map((b, i) => (
              <li key={i}>
                <span className={s.iconBenh} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 1-2-2z" /></svg>
                </span>
                <div>
                  <b>{b.tieuDe}</b>
                  <span className={s.benhDong}>{b.dong ? cur.ten : `Mọi dòng ${hang.ten}`}</span>
                  {b.moTa ? <span className={s.benhMoTa}>{b.moTa}</span> : null}
                  {b.dichVu ? <Link href={`/dich-vu/${b.dichVu}/`} className="link-nhan nho">Xem dịch vụ →</Link> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {phuTung.length ? (
        <section className="khoi" aria-labelledby="phu-tung">
          <div>
            <h2 id="phu-tung" className={s.h2}>Phụ tùng thợ mang theo</h2>
            <p className="phu">Lấy từ kho VCparts, đúng mã cho {hang.ten} {cur.ten}. Có tem, có hoá đơn.</p>
          </div>
          <BangGiaHangMuc
            tieuDe="Giá phụ tùng"
            hangMuc={phuTung.map((p) => ({
              id: p.id, ten: p.ten, loaiNhan: `VCparts · ${p.dichVu}`,
              giaHienThi: pk && p.giaTheoPhanKhuc ? p.giaTheoPhanKhuc[pk].hienThi : "Báo theo xe",
            }))}
            hienLoai
            cuoi={baoHanh.phuTung ? <div className={s.chan}>Bảo hành {baoHanh.phuTung} tháng phụ tùng{baoHanh.cong ? `, ${baoHanh.cong} tháng tiền công` : ""}.</div> : null}
          />
        </section>
      ) : null}

      <KhoiCta
        nhan="Xe đã chọn sẵn" tieuDe={tenXe}
        moTa="Bảo dưỡng tại nhà, hầm chung cư hoặc bãi công ty. Báo giá trước, bạn đồng ý mới làm."
        href={`/dat-lich/?${q}`} chuNut={`Đặt lịch cho ${cur.ten}${doi.tu ? ` ${doi.nhan}` : ""}`}
      />
    </>
  );
}
