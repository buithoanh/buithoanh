"use client";
// Ô "Xe bạn đang ở đâu? → Kiểm tra": gọi POST /api/vung-phuc-vu/kiem-tra với địa chỉ khách gõ, hiện câu trả lời của server.
import Link from "next/link";
import { useId, useState } from "react";
import s from "./KhoiVungPhucVu.module.css";

export default function KiemTraVung({ nhan = "Xe bạn đang ở đâu?" }) {
  const id = useId();
  const [diaChi, setDiaChi] = useState("");
  const [loi, setLoi] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [kq, setKq] = useState(null);

  const kiemTraO = (v) => (v.trim().length < 3 ? "Gõ địa chỉ hoặc tên phường (ít nhất 3 chữ)." : "");

  async function gui(e) {
    e.preventDefault();
    const l = kiemTraO(diaChi);
    setLoi(l);
    if (l || dangGui) return;
    setDangGui(true);
    setKq(null);
    try {
      const r = await fetch("/api/vung-phuc-vu/kiem-tra", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ diaChi: diaChi.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setKq({ loi: d.loi || "Chưa kiểm tra được lúc này. Thử lại, hoặc gọi hotline." });
      else setKq(d);
    } catch {
      setKq({ loi: "Không kết nối được. Kiểm tra mạng rồi thử lại." });
    } finally {
      setDangGui(false);
    }
  }

  return (
    <form className={s.form} onSubmit={gui} noValidate>
      <label htmlFor={`${id}-o`} className={s.nhanO}>{nhan}</label>
      <div className={s.hang}>
        <input
          id={`${id}-o`} name="diaChi" type="text" autoComplete="street-address" placeholder="Gõ địa chỉ hoặc tên phường"
          className={`${s.o} ${loi ? s.oLoi : ""}`} value={diaChi} aria-invalid={loi ? true : undefined}
          aria-describedby={loi ? `${id}-loi` : undefined}
          onChange={(e) => { setDiaChi(e.target.value); if (loi) setLoi(kiemTraO(e.target.value)); }}
          onBlur={() => diaChi && setLoi(kiemTraO(diaChi))}
        />
        <button type="submit" className={`nut nut-toi ${s.nutKiemTra}`} disabled={dangGui}>{dangGui ? "Đang kiểm tra…" : "Kiểm tra"}</button>
      </div>
      {loi ? <span id={`${id}-loi`} className={s.loi} role="alert">{loi}</span> : null}
      <div role="status" aria-live="polite">
        {kq?.loi ? <p className="bao bao-loi">{kq.loi}</p> : null}
        {kq && !kq.loi ? (
          <div className={`bao ${kq.trongVung ? "bao-ok" : "bao-vang"} ${s.kq}`}>
            <p>{kq.thongBao}</p>
            {kq.trongVung
              ? <Link href="/dat-lich/" className="link-nhan">Đặt lịch ngay →</Link>
              : <Link href="/goi-gap/" className="link-nhan">Gọi cố vấn hướng dẫn →</Link>}
          </div>
        ) : null}
      </div>
    </form>
  );
}
