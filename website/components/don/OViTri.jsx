"use client";
// Ô vị trí xe: nút "Lấy vị trí" (geolocation) + ô gõ địa chỉ + kết quả kiểm tra vùng.
// vt: kết quả useViTri(). Gõ địa chỉ thì kiểm tra khi rời ô hoặc bấm Enter.
import { useEffect, useRef } from "react";
import Icon from "../Icon";
import { TruongNhap, oNhap } from "../chung/Form";
import ThongBaoVung from "./ThongBaoVung";
import s from "./OViTri.module.css";

export default function OViTri({
  vt, id = "dia-chi", nhanNut = "Lấy vị trí hiện tại", nhanO = "Hoặc gõ địa chỉ", goiY = "Số nhà, đường, phường",
  loi, khanCap = false, hotline, linkKeoXe, ketQuaTruocO = false, refO,
}) {
  // Kiểm tra vùng khi ngừng gõ ~1 giây, hoặc khi rời ô (trễ một nhịp để cú bấm kế tiếp không bị lệch do khung kết quả hiện ra)
  const kiemRef = useRef(vt.kiemDiaChi);
  kiemRef.current = vt.kiemDiaChi;
  useEffect(() => {
    if (vt.toaDo || vt.diaChi.trim().length < 6) return;
    const hen = setTimeout(() => kiemRef.current(), 1000);
    return () => clearTimeout(hen);
  }, [vt.diaChi, vt.toaDo]);

  const ketQua = (
    <>
      {vt.dangKiem ? <p className={s.dangKiem} role="status">Đang kiểm tra vùng phục vụ…</p> : null}
      {vt.loi ? <p className="bao bao-vang" role="alert">{vt.loi}</p> : null}
      <ThongBaoVung ketQua={vt.ketQua} khanCap={khanCap} hotline={hotline} linkKeoXe={linkKeoXe} />
    </>
  );
  const nhanNutHien = vt.dangLay ? "Đang lấy vị trí…" : vt.toaDo && khanCap ? "Lấy lại vị trí" : nhanNut;
  return (
    <div className={s.khung}>
      <button type="button" className={`${s.nutLay} ${khanCap ? s.nutLon : ""}`} onClick={vt.layViTri} disabled={vt.dangLay}>
        <Icon name="dinh-vi" size={khanCap ? 20 : 18} />
        {nhanNutHien}
      </button>
      {ketQuaTruocO ? ketQua : null}
      <TruongNhap id={id} nhan={nhanO} loi={loi}>
        <input
          {...oNhap(id, loi)} ref={refO} type="text" inputMode="text" autoComplete="street-address" placeholder={goiY}
          value={vt.diaChi} onChange={(e) => vt.doiDiaChi(e.target.value)} onBlur={() => setTimeout(() => kiemRef.current(), 200)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); vt.kiemDiaChi(); } }}
        />
      </TruongNhap>
      {ketQuaTruocO ? null : ketQua}
    </div>
  );
}
