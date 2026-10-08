"use client";
// Tab "Gói hợp đồng theo loại đội xe" (Taxi / Cho thuê tự lái / Xe công ty). Phím mũi tên đổi tab.
// Nội dung (chữ giới thiệu, không có giá) do trang truyền vào.
import { useState } from "react";
import Icon from "../Icon";
import s from "./TabDoiXe.module.css";

export default function TabDoiXe({ ds }) {
  const [chon, datChon] = useState(0);
  const phim = (e) => {
    const buoc = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!buoc) return;
    e.preventDefault();
    const i = (chon + buoc + ds.length) % ds.length;
    datChon(i);
    document.getElementById(`tab-doi-xe-${i}`)?.focus();
  };
  const g = ds[chon];
  return (
    <>
      <div role="tablist" aria-label="Loại đội xe" className={s.tabs} onKeyDown={phim}>
        {ds.map((x, i) => (
          <button
            key={x.id} id={`tab-doi-xe-${i}`} type="button" role="tab" aria-selected={i === chon} aria-controls="bang-doi-xe"
            tabIndex={i === chon ? 0 : -1} className={s.tab} onClick={() => datChon(i)}
          >{x.tab}</button>
        ))}
      </div>
      <div id="bang-doi-xe" role="tabpanel" aria-labelledby={`tab-doi-xe-${chon}`} className={`the ${s.bang}`} tabIndex={0}>
        <div className={s.dau}>
          <span className={s.icon} aria-hidden="true"><Icon name="xe" size={22} /></span>
          <div><b>{g.tieuDe}</b><span>{g.phu}</span></div>
        </div>
        <ul>
          {g.y.map((t) => <li key={t}><Icon name="check" size={18} /><span>{t}</span></li>)}
        </ul>
        <p className={s.ghiChu}>{g.ghiChu}</p>
      </div>
    </>
  );
}
