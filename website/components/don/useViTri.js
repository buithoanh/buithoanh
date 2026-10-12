"use client";
// Trạng thái vị trí xe: lấy bằng trình duyệt (xin quyền) hoặc gõ địa chỉ, rồi kiểm tra vùng
// bằng POST /api/vung-phuc-vu/kiem-tra. Dùng chung cho DatLich (bước 3) và GoiGap.
import { useCallback, useRef, useState } from "react";
import { goiApi } from "./goi-api";

const LOI_QUYEN = "Bạn chưa cho phép lấy vị trí. Gõ địa chỉ vào ô bên dưới, hoặc bật quyền vị trí cho trang này trong trình duyệt.";
const LOI_LAY = "Chưa lấy được vị trí lúc này. Gõ địa chỉ vào ô bên dưới giúp mình nhé.";

export default function useViTri(dau = {}) {
  const [diaChi, setDiaChi] = useState(dau.diaChi || "");
  const [toaDo, setToaDo] = useState(dau.toaDo || null);
  const [ketQua, setKetQua] = useState(dau.ketQua || null);
  const [loi, setLoi] = useState("");
  const [banDoLoi, setBanDoLoi] = useState(false); // bản đồ lỗi: vẫn cho đi tiếp, server kiểm lại khi gửi
  const [dangLay, setDangLay] = useState(false);
  const [dangKiem, setDangKiem] = useState(false);
  const lan = useRef(0);
  const daKiem = useRef(dau.ketQua ? dau.diaChi || "" : null);
  const choKq = useRef(null); // promise kết quả kiểm tra địa chỉ gần nhất

  const kiem = useCallback(async (body) => {
    const so = ++lan.current;
    setDangKiem(true); setLoi(""); setBanDoLoi(false);
    const r = await goiApi("/api/vung-phuc-vu/kiem-tra", { body });
    if (so !== lan.current) return { ok: false, cu: true };
    setDangKiem(false);
    if (r.ok) { setKetQua(r.data); return { ok: true, ketQua: r.data }; }
    setKetQua(null);
    setLoi(r.data.loi);
    const banDo = ["BAN_DO_LOI", "BAN_DO_CHUA_CAU_HINH", "LOI_MANG", "QUA_NHIEU_LAN", "LOI_MAY_CHU"].includes(r.data.ma);
    setBanDoLoi(banDo);
    return { ok: false, loi: r.data.loi, banDoLoi: banDo };
  }, []);

  const layViTri = useCallback(() => {
    setLoi("");
    if (typeof navigator === "undefined" || !navigator.geolocation) { setLoi(LOI_LAY); return; }
    setDangLay(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setDangLay(false);
        const td = { lat: Math.round(p.coords.latitude * 1e6) / 1e6, lng: Math.round(p.coords.longitude * 1e6) / 1e6 };
        setToaDo(td); setDiaChi(""); daKiem.current = null; choKq.current = null;
        kiem(td);
      },
      (e) => { setDangLay(false); setLoi(e?.code === 1 ? LOI_QUYEN : LOI_LAY); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, [kiem]);

  const doiDiaChi = useCallback((v) => {
    setDiaChi(v);
    if (toaDo) setToaDo(null);
    if (ketQua || loi) { setKetQua(null); setLoi(""); setBanDoLoi(false); }
    daKiem.current = null; choKq.current = null;
    lan.current++; setDangKiem(false);
  }, [toaDo, ketQua, loi]);

  /** Kiểm tra địa chỉ đã gõ (gọi khi rời ô / bấm Enter / trước khi đi tiếp).
   *  Trả { ok, ketQua } hoặc { ok: false, loi, banDoLoi }; null khi chưa đủ địa chỉ. */
  const kiemDiaChi = useCallback(async () => {
    if (toaDo) return ketQua ? { ok: true, ketQua } : { ok: false, loi, banDoLoi };
    const v = diaChi.trim();
    if (v.length < 6) return null;
    if (daKiem.current === v && choKq.current) return choKq.current; // đang/đã kiểm tra đúng địa chỉ này
    daKiem.current = v;
    choKq.current = kiem({ diaChi: v });
    return choKq.current;
  }, [diaChi, toaDo, kiem]);

  /** Dữ liệu viTri gửi kèm đơn. */
  const giaTriGui = () => (toaDo ? { lat: toaDo.lat, lng: toaDo.lng, diaChi: ketQua?.viTri?.diaChi || "" } : { diaChi: diaChi.trim() });
  const coViTri = Boolean(toaDo || diaChi.trim().length >= 6);

  return { diaChi, toaDo, ketQua, loi, banDoLoi, dangLay, dangKiem, layViTri, doiDiaChi, kiemDiaChi, setKetQua, setLoi, giaTriGui, coViTri };
}
