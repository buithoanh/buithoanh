"use client";
import { useState } from "react";

const empty = { dichVu: "", xe: "", bienSo: "", viTri: "", gio: "", sdt: "", ghiChu: "", website: "" };

export default function BookingForm({ services, endpoint, hotline, zalo }) {
  const [f, setF] = useState(empty);
  const [state, setState] = useState("idle"); // idle | sending | sent | error | offline
  const [loi, setLoi] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (!endpoint) { setState("offline"); return; }
    setState("sending");
    try {
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      if (r.ok) { setState("sent"); return; }
      setLoi((await r.json().catch(() => ({}))).loi || "");
      setState("error");
    } catch { setState("error"); }
  }

  const summary = `Đặt lịch: ${f.dichVu} | Xe: ${f.xe} ${f.bienSo} | Vị trí: ${f.viTri} | Giờ: ${f.gio} | SĐT: ${f.sdt}${f.ghiChu ? ` | Ghi chú: ${f.ghiChu}` : ""}`;

  if (state === "sent") return <p className="notice">Đã nhận lịch hẹn. Nhân viên sẽ gọi lại số {f.sdt} để báo giá và xác nhận giờ.</p>;

  return (
    <form className="booking" onSubmit={submit}>
      <label htmlFor="dichVu">Dịch vụ cần làm
        <select id="dichVu" required value={f.dichVu} onChange={set("dichVu")}>
          <option value="">Chọn dịch vụ</option>
          {services.map((s) => <option key={s}>{s}</option>)}
          <option>Khác / chưa rõ lỗi</option>
        </select>
      </label>
      <div className="two">
        <label htmlFor="xe">Hãng, dòng, đời xe<input id="xe" required placeholder="Ví dụ: Toyota Vios 2019" value={f.xe} onChange={set("xe")} /></label>
        <label htmlFor="bienSo">Biển số<input id="bienSo" placeholder="30A-123.45" value={f.bienSo} onChange={set("bienSo")} /></label>
      </div>
      <label htmlFor="viTri">Vị trí xe<input id="viTri" required placeholder="Số nhà, đường, quận" value={f.viTri} onChange={set("viTri")} /></label>
      <div className="two">
        <label htmlFor="gio">Giờ hẹn mong muốn<input id="gio" type="datetime-local" value={f.gio} onChange={set("gio")} /></label>
        <label htmlFor="sdt">Số điện thoại<input id="sdt" required type="tel" inputMode="tel" pattern="[0-9 +.]{9,15}" placeholder="09xx xxx xxx" value={f.sdt} onChange={set("sdt")} /></label>
      </div>
      {/* Ô bẫy bot: ẩn với người thật */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set("website")} style={{ position: "absolute", left: "-9999px" }} />
      <label htmlFor="ghiChu">Tình trạng xe (không bắt buộc)<textarea id="ghiChu" rows={3} value={f.ghiChu} onChange={set("ghiChu")} /></label>
      <button className="btn btn-primary" type="submit" disabled={state === "sending"}>{state === "sending" ? "Đang gửi…" : "Gửi lịch hẹn"}</button>
      {state === "error" && <p className="notice">{loi ? `${loi} ` : ""}Chưa gửi được. Thử lại, hoặc gọi {hotline || "hotline"} để đặt ngay.</p>}
      {state === "offline" && (
        <div className="notice">
          <p>Hệ thống nhận lịch online chưa mở. Gửi nội dung dưới đây qua Zalo hoặc đọc khi gọi hotline:</p>
          <p><b>{summary}</b></p>
          <p>{hotline ? <>Hotline: <a href={`tel:${hotline.replace(/[^\d+]/g, "")}`}>{hotline}</a></> : "Hotline sắp có."} {zalo && <> · <a href={zalo} target="_blank" rel="noopener">Mở Zalo</a></>}</p>
        </div>
      )}
    </form>
  );
}
