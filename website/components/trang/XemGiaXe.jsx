"use client";
// "Xem giá cho xe của bạn": chọn dịch vụ (hoặc cố định một dịch vụ) + hãng/dòng/đời (ChonXe) → POST /api/bao-gia-so-bo.
// Danh sách xe chỉ tải khi khối hiện trên màn hình (khối ẩn trên điện thoại thì không tải gì).
// dichVu: [{ slug, ten }] cho ô chọn; coDinh: slug dịch vụ cố định (trang dịch vụ); kieu: "the" (thẻ trắng ở hero máy tính) | "hop" (hộp cam nhạt).
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ChonXe from "../chung/ChonXe";
import { TruongNhap, oNhap } from "../chung/Form";
import s from "./XemGiaXe.module.css";

export default function XemGiaXe({ dichVu = [], coDinh = null, kieu = "the", tieuDe = "Xem giá cho xe của bạn", nhanGia = "Giá sơ bộ" }) {
  const goc = useRef(null);
  const [hien, setHien] = useState(false);
  const [dv, setDv] = useState(coDinh || dichVu[0]?.slug || "");
  const [xe, setXe] = useState({ hang: "", dong: "", doi: null });
  const [gia, setGia] = useState(null);
  const [dangTinh, setDangTinh] = useState(false);

  useEffect(() => {
    const el = goc.current;
    if (!el || typeof IntersectionObserver === "undefined") { setHien(true); return; }
    const io = new IntersectionObserver((ds) => { if (ds.some((d) => d.isIntersecting)) { setHien(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!hien || !dv) return;
    const huy = new AbortController();
    setDangTinh(true);
    fetch("/api/bao-gia-so-bo", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: huy.signal,
      body: JSON.stringify({ dichVu: [dv], ...(xe.dong ? { dongXe: xe.dong } : {}) }),
    })
      .then((r) => r.json().then((d) => (r.ok ? d : { loi: d.loi || "Chưa tính được giá lúc này." })))
      .then((d) => { setGia(d); setDangTinh(false); })
      .catch((e) => { if (e.name !== "AbortError") { setGia({ loi: "Không kết nối được, thử lại sau." }); setDangTinh(false); } });
    return () => huy.abort();
  }, [hien, dv, xe.dong]);

  const q = new URLSearchParams();
  if (dv) q.set("dv", dv);
  if (xe.hang) q.set("hang", xe.hang);
  if (xe.dong) q.set("dong", xe.dong);
  if (xe.doi) q.set("doi", String(xe.doi));
  const giaChu = gia?.loi ? "—" : gia?.hienThi || "…";

  return (
    <div ref={goc} className={`${s.khung} ${s[kieu]}`} aria-busy={dangTinh}>
      <b className={s.tieuDe}>{tieuDe}</b>
      {!coDinh && dichVu.length ? (
        <TruongNhap id="xem-gia-dv" nhan="Dịch vụ">
          <select {...oNhap("xem-gia-dv")} value={dv} onChange={(e) => setDv(e.target.value)}>
            {dichVu.map((d) => <option key={d.slug} value={d.slug}>{d.ten}</option>)}
          </select>
        </TruongNhap>
      ) : null}
      {hien ? (
        <ChonXe idTien={`xem-gia-${coDinh || "xe"}`} onChange={(x) => setXe({ hang: x.hang, dong: x.dong, doi: x.doi })} />
      ) : <div className={s.cho} aria-hidden="true" />}
      <div className={s.gia} role="status" aria-live="polite">
        <span>{nhanGia}{gia?.xe?.ten ? ` · ${gia.xe.ten}` : ""}</span>
        <b>{giaChu}</b>
      </div>
      <span className={s.ghiChu}>{gia?.loi || gia?.ghiChu || "Giá chính thức chốt sau khi thợ kiểm tra xe."}</span>
      <Link href={`/dat-lich/${q.size ? `?${q}` : ""}`} className={`nut ${kieu === "the" ? "nut-toi" : "nut-chinh"} ${s.nut}`}>Đặt lịch với giá này</Link>
    </div>
  );
}
