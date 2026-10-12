"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { useLocate } from "./useLocate";

/**
 * Ô "Xe bạn đang ở đâu, cần gì?" ở đầu trang chủ. Học từ Xanh SM/Grab: màn hình đầu chỉ có một việc chính.
 * Chọn dịch vụ + vị trí rồi chuyển sang trang đặt lịch với thông tin đã điền sẵn.
 */
export default function QuickBook({ services, telHref, hotline }) {
  const router = useRouter();
  const [dv, setDv] = useState("");
  const [viTri, setViTri] = useState("");
  const { locate, locating, locError } = useLocate(setViTri);

  function go(e) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (dv) q.set("dv", dv);
    if (viTri) q.set("vt", viTri);
    router.push(`/dat-lich/${q.size ? `?${q}` : ""}`);
  }

  return (
    <form className="qb" onSubmit={go} aria-labelledby="qb-title">
      <h2 id="qb-title" className="qb-title">Xe bạn đang ở đâu, cần gì?</h2>
      <fieldset className="qb-services">
        <legend className="sr-only">Chọn dịch vụ</legend>
        {services.map((s) => (
          <label key={s.slug} className={`qb-svc${dv === s.slug ? " on" : ""}`}>
            <input type="radio" name="dv" value={s.slug} checked={dv === s.slug} onChange={() => setDv(s.slug)} />
            <span className="qb-ic"><Icon name={s.icon} size={26} /></span>
            <span>{s.ngan}</span>
          </label>
        ))}
      </fieldset>
      <label className="qb-loc">
        <Icon name="pin" size={20} className="qb-loc-pin" />
        <span className="sr-only">Vị trí xe</span>
        <input value={viTri} onChange={(e) => setViTri(e.target.value)} placeholder="Xe đang đỗ ở đâu?" autoComplete="street-address" />
        <button type="button" className="qb-locate" onClick={locate} disabled={locating} aria-label="Dùng vị trí hiện tại">
          <Icon name="locate" size={20} /><span>{locating ? "Đang lấy…" : "Vị trí của tôi"}</span>
        </button>
      </label>
      {locError && <p className="qb-err" role="status">{locError}</p>}
      <button className="btn btn-primary btn-lg btn-block" type="submit">Tìm thợ tới <Icon name="arrow" size={20} /></button>
      <p className="qb-alt">
        {telHref ? <>Gấp? Gọi ngay <a href={telHref}><b>{hotline}</b></a></> : <>Thợ báo giá trước, bạn đồng ý mới làm.</>}
      </p>
    </form>
  );
}
