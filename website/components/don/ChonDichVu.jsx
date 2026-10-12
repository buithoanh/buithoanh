"use client";
// Lưới chọn nhiều dịch vụ (bước 1 đặt lịch). dichVu: [{ slug, ten, moTaNgan }], chon: mảng slug.
import { TheChon } from "./NutChon";
import Icon, { iconDichVu } from "../Icon";
import s from "./ChonDichVu.module.css";

export default function ChonDichVu({ dichVu, chon, onDoi, loi }) {
  const bat = (slug) => onDoi(chon.includes(slug) ? chon.filter((x) => x !== slug) : [...chon, slug]);
  return (
    <div className={s.khung} role="group" aria-labelledby="tieu-de-buoc" aria-describedby={loi ? "dichVu-loi" : undefined}>
      <div className={s.luoi}>
        {dichVu.map((d) => (
          <TheChon key={d.slug} chon={chon.includes(d.slug)} onClick={() => bat(d.slug)} ten={d.ten} moTa={d.moTaNgan} data-dich-vu={d.slug}
            icon={iconDichVu[d.slug] ? <span className={s.icon}><Icon name={iconDichVu[d.slug]} size={24} /></span> : null} />
        ))}
      </div>
      {loi ? <span id="dichVu-loi" className={s.loi} role="alert">{loi}</span> : null}
    </div>
  );
}
