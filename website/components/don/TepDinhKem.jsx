"use client";
// Thêm ảnh/video (không bắt buộc). Giới hạn lấy từ GIOI_HAN_TEP của server (gioiHan): số ảnh, số video, MB, giây.
// Thời lượng video đo bằng thẻ <video> trên trình duyệt, gửi kèm ô "thoiLuongVideo".
import { useRef, useState } from "react";
import Icon from "../Icon";
import s from "./TepDinhKem.module.css";

function doThoiLuong(file) {
  return new Promise((ok) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    const xong = (giay) => { URL.revokeObjectURL(url); ok(giay); };
    v.onloadedmetadata = () => xong(Number.isFinite(v.duration) ? v.duration : null);
    v.onerror = () => xong(null);
    setTimeout(() => xong(null), 8000);
    v.src = url;
  });
}

const mb = (b) => (b / 1024 / 1024).toLocaleString("vi-VN", { maximumFractionDigits: 1 });

/** tep: [{ file, loai: "anh"|"video", giay, url }] */
export default function TepDinhKem({ tep, onDoi, gioiHan, loi: loiNgoai }) {
  const g = gioiHan;
  const oChon = useRef(null);
  const [loi, setLoi] = useState("");

  async function chon(e) {
    const ds = Array.from(e.target.files || []);
    e.target.value = "";
    let moi = [...tep];
    const baoLoi = [];
    for (const f of ds) {
      const laAnh = f.type.startsWith("image/");
      const laVideo = f.type.startsWith("video/");
      if (!laAnh && !laVideo) { baoLoi.push(`"${f.name}" không phải ảnh hay video.`); continue; }
      if (laAnh) {
        if (moi.filter((t) => t.loai === "anh").length >= g.soAnh) { baoLoi.push(`Tối đa ${g.soAnh} ảnh.`); continue; }
        if (f.size > g.anhToiDaMB * 1048576) { baoLoi.push(`Ảnh "${f.name}" ${mb(f.size)} MB, tối đa ${g.anhToiDaMB} MB.`); continue; }
        moi.push({ file: f, loai: "anh", url: URL.createObjectURL(f) });
      } else {
        if (moi.filter((t) => t.loai === "video").length >= g.soVideo) { baoLoi.push(`Tối đa ${g.soVideo} video.`); continue; }
        if (f.size > g.videoToiDaMB * 1048576) { baoLoi.push(`Video ${mb(f.size)} MB, tối đa ${g.videoToiDaMB} MB.`); continue; }
        const giay = await doThoiLuong(f);
        if (giay != null && giay > g.videoToiDaGiay + 0.5) { baoLoi.push(`Video dài ${Math.round(giay)} giây, tối đa ${g.videoToiDaGiay} giây. Cắt ngắn rồi thêm lại nhé.`); continue; }
        moi.push({ file: f, loai: "video", giay });
      }
    }
    setLoi(baoLoi.join(" "));
    onDoi(moi);
  }

  function bo(i) {
    const t = tep[i];
    if (t.url) URL.revokeObjectURL(t.url);
    onDoi(tep.filter((_, j) => j !== i));
    setLoi("");
  }

  const hetCho = tep.filter((t) => t.loai === "anh").length >= g.soAnh && tep.filter((t) => t.loai === "video").length >= g.soVideo;
  const loiHien = loiNgoai || loi;
  return (
    <div className={s.khung}>
      <input ref={oChon} id="tep" type="file" accept="image/*,video/*" multiple className="sr-only" onChange={chon} tabIndex={-1} aria-hidden="true" />
      {tep.length ? (
        <ul className={s.ds} aria-label="Tệp đã thêm">
          {tep.map((t, i) => (
            <li key={`${t.file.name}-${i}`} className={s.tep}>
              {t.url ? <img src={t.url} alt="" width={44} height={44} className={s.anh} /> : <span className={s.video} aria-hidden="true">▶</span>}
              <span className={s.ten}>{t.file.name}<small>{t.loai === "video" && t.giay ? ` · ${Math.round(t.giay)} giây` : ""} · {mb(t.file.size)} MB</small></span>
              <button type="button" className={s.bo} onClick={() => bo(i)} aria-label={`Bỏ tệp ${t.file.name}`}><Icon name="dong-x" size={18} /></button>
            </li>
          ))}
        </ul>
      ) : null}
      {!hetCho ? (
        <button type="button" id="tep-nut" className={s.nut} onClick={() => oChon.current?.click()} aria-describedby={loiHien ? "tep-loi" : undefined}>
          <Icon name="may-anh" size={18} />
          Thêm ảnh hoặc video (tối đa {g.soAnh} ảnh / {g.videoToiDaGiay} giây)
        </button>
      ) : null}
      {loiHien ? <span id="tep-loi" className={s.loi} role="alert">{loiHien}</span> : null}
    </div>
  );
}
