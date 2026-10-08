"use client";
// Chọn phân khúc xe A–D (màn BangGia). Nhóm radio đúng chuẩn: Tab vào nhóm, mũi tên trái/phải đổi lựa chọn.
// phanKhuc: [{ ma, tenNgan, moTa }] từ bảng giá chung; giaTri: "A"…"D"; onChange(ma).
import { useRef } from "react";
import s from "./ChonPhanKhuc.module.css";

export default function ChonPhanKhuc({ phanKhuc, giaTri, onChange, nhan = "Phân khúc xe" }) {
  const nut = useRef([]);
  const phim = (e, i) => {
    const buoc = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!buoc) return;
    e.preventDefault();
    const k = (i + buoc + phanKhuc.length) % phanKhuc.length;
    onChange(phanKhuc[k].ma);
    nut.current[k]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={nhan} className={s.nhom}>
      {phanKhuc.map((p, i) => {
        const chon = p.ma === giaTri;
        return (
          <button
            key={p.ma} type="button" role="radio" aria-checked={chon} tabIndex={chon ? 0 : -1}
            ref={(el) => { nut.current[i] = el; }}
            className={`${s.nut} ${chon ? s.chon : ""}`} onClick={() => onChange(p.ma)} onKeyDown={(e) => phim(e, i)}
          >
            <b>{p.ma}</b>
            <span>{p.tenNgan}</span>
          </button>
        );
      })}
    </div>
  );
}
