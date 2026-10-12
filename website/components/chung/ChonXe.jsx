"use client";
// Chọn hãng → dòng → đời xe, dữ liệu từ GET /api/xe (hãng, dòng, phân khúc, đời từ–đến).
// danhMuc: truyền sẵn từ server nếu có (kết quả layDanhMucXe) để khỏi gọi API; không có thì tự tải.
// onChange({ hang, dong, doi, phanKhuc, tenXe }) mỗi khi đổi.
import { useEffect, useMemo, useState } from "react";
import { TruongNhap, oNhap } from "./Form";
import s from "./ChonXe.module.css";

export default function ChonXe({ danhMuc: coSan, giaTri = {}, onChange, xeDien = false, loi = {}, idTien = "xe", hienDoi = true }) {
  const [danhMuc, setDanhMuc] = useState(coSan || null);
  const [loiTai, setLoiTai] = useState("");
  const [hang, setHang] = useState(giaTri.hang || "");
  const [dong, setDong] = useState(giaTri.dong || "");
  const [doi, setDoi] = useState(giaTri.doi ? String(giaTri.doi) : "");

  useEffect(() => {
    if (coSan) return;
    fetch(`/api/xe${xeDien ? "?xeDien=1" : ""}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDanhMuc)
      .catch(() => setLoiTai("Chưa tải được danh sách xe. Bạn có thể gõ tên xe vào ô ghi chú."));
  }, [coSan, xeDien]);

  const hangChon = useMemo(() => danhMuc?.find((h) => h.slug === hang), [danhMuc, hang]);
  const dongChon = useMemo(() => hangChon?.dong.find((d) => d.slug === dong), [hangChon, dong]);
  const cacDoi = useMemo(() => {
    if (!dongChon) return [];
    const den = dongChon.doiDen || new Date().getFullYear();
    const tu = dongChon.doiTu || den - 15;
    return Array.from({ length: Math.max(0, den - tu + 1) }, (_, i) => den - i);
  }, [dongChon]);

  useEffect(() => {
    onChange?.({
      hang, dong, doi: doi ? Number(doi) : null,
      phanKhuc: dongChon?.phanKhuc || null,
      tenXe: dongChon ? `${dongChon.tenDayDu || dongChon.ten}${doi ? ` ${doi}` : ""}` : "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hang, dong, doi, dongChon]);

  return (
    <div className={hienDoi ? s.luoi3 : s.luoi2}>
      {loiTai ? <p className="bao bao-vang" role="status">{loiTai}</p> : null}
      <TruongNhap id={`${idTien}-hang`} nhan="Hãng xe" loi={loi.hang}>
        <select {...oNhap(`${idTien}-hang`, loi.hang)} value={hang} onChange={(e) => { setHang(e.target.value); setDong(""); setDoi(""); }} disabled={!danhMuc}>
          <option value="">{danhMuc ? "Chọn hãng" : "Đang tải…"}</option>
          {danhMuc?.map((h) => <option key={h.slug} value={h.slug}>{h.ten}</option>)}
        </select>
      </TruongNhap>
      <TruongNhap id={`${idTien}-dong`} nhan="Dòng xe" loi={loi.dong}>
        <select {...oNhap(`${idTien}-dong`, loi.dong)} value={dong} onChange={(e) => { setDong(e.target.value); setDoi(""); }} disabled={!hangChon}>
          <option value="">Chọn dòng</option>
          {hangChon?.dong.map((d) => <option key={d.slug} value={d.slug}>{d.ten}</option>)}
        </select>
      </TruongNhap>
      {hienDoi && (
        <TruongNhap id={`${idTien}-doi`} nhan="Đời xe" loi={loi.doi}>
          <select {...oNhap(`${idTien}-doi`, loi.doi)} value={doi} onChange={(e) => setDoi(e.target.value)} disabled={!dongChon}>
            <option value="">Năm</option>
            {cacDoi.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </TruongNhap>
      )}
    </div>
  );
}
