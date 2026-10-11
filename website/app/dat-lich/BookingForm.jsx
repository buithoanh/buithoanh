"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "../../components/Icon";
import { useLocate } from "../../components/useLocate";

// Đặt lịch 3 bước, học từ bTaskee: chọn dịch vụ → vị trí và giờ → liên hệ và xác nhận.
const OTHER = { slug: "khac", ten: "Khác / chưa rõ lỗi", icon: "help" };
const TIMES = ["Càng sớm càng tốt", "Trong hôm nay", "Ngày mai"];
const STEP_TITLES = ["Xe cần làm gì?", "Thợ tới đâu, lúc nào?", "Liên hệ và xác nhận"];
const empty = { dichVu: "", xe: "", bienSo: "", viTri: "", gio: TIMES[0], gioCuThe: "", sdt: "", ghiChu: "" };

export default function BookingForm({ services, endpoint, hotline, telHref, zalo }) {
  const all = [...services, OTHER];
  const [step, setStep] = useState(0);
  const [f, setF] = useState(empty);
  const [state, setState] = useState("idle"); // idle | sending | sent | error | offline
  const [copied, setCopied] = useState(false);
  const top = useRef(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const { locate, locating, locError } = useLocate((v) => setF((x) => ({ ...x, viTri: v })));

  // Nhận thông tin điền sẵn từ ô đặt nhanh ở trang chủ hoặc nút trên trang dịch vụ (?dv=...&vt=...).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const svc = all.find((s) => s.slug === q.get("dv"));
    const vt = q.get("vt") || "";
    if (svc || vt) {
      setF((x) => ({ ...x, dichVu: svc ? svc.ten : x.dichVu, viTri: vt || x.viTri }));
      if (svc) setStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function go(n) {
    setStep(n);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const gio = f.gio === "Chọn giờ" ? (f.gioCuThe ? new Date(f.gioCuThe).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "") : f.gio;
  const gps = f.viTri.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  const banDo = gps ? `https://maps.google.com/?q=${gps[1]},${gps[2]}` : "";
  const summary = `Đặt lịch: ${f.dichVu} | Xe: ${f.xe}${f.bienSo ? ` ${f.bienSo}` : ""} | Vị trí: ${banDo || f.viTri} | Giờ: ${gio} | SĐT: ${f.sdt}${f.ghiChu ? ` | Ghi chú: ${f.ghiChu}` : ""}`;

  async function submit(e) {
    e.preventDefault();
    if (step < 2) { go(step + 1); return; }
    if (!endpoint) { setState("offline"); return; }
    setState("sending");
    try {
      const { gioCuThe, ...rest } = f;
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...rest, gio, ...(banDo && { banDo }), nguon: "website" }) });
      setState(r.ok ? "sent" : "error");
    } catch { setState("error"); }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(summary); setCopied(true); } catch { setCopied(false); }
  }

  if (state === "sent") {
    return (
      <div className="bk-done">
        <span className="bk-done-ic"><Icon name="check" size={36} /></span>
        <h2>Đã nhận lịch hẹn</h2>
        <p>Nhân viên sẽ gọi lại số <b>{f.sdt}</b> để báo giá và xác nhận giờ. Khi có kỹ thuật viên nhận lệnh, bạn tra cứu được ai đang tới.</p>
        <Link className="btn btn-dark" href="/tra-cuu/"><Icon name="search" size={20} />Tra cứu lệnh sửa chữa</Link>
      </div>
    );
  }

  return (
    <form className="bk" onSubmit={submit} ref={top}>
      <div className="bk-progress" aria-hidden="true">
        {STEP_TITLES.map((t, i) => <span key={t} className={i <= step ? "on" : ""} />)}
      </div>
      <p className="bk-count">Bước {step + 1}/3</p>
      <h2 className="bk-title" tabIndex={-1}>{STEP_TITLES[step]}</h2>

      {step === 0 && (
        <fieldset className="bk-svcs">
          <legend className="sr-only">Chọn dịch vụ</legend>
          {all.map((s) => (
            <label key={s.slug} className={`bk-svc${f.dichVu === s.ten ? " on" : ""}`}>
              <input type="radio" name="dichVu" required value={s.ten} checked={f.dichVu === s.ten}
                onChange={() => { setF((x) => ({ ...x, dichVu: s.ten })); go(1); }} />
              <span className="bk-svc-ic"><Icon name={s.icon} size={28} /></span>
              <span>{s.ten}</span>
            </label>
          ))}
        </fieldset>
      )}

      {step === 1 && (
        <div className="bk-fields">
          <label className="fld">Vị trí xe
            <span className="fld-row">
              <input required value={f.viTri} onChange={set("viTri")} placeholder="Số nhà, đường, quận" autoComplete="street-address" />
              <button type="button" className="btn btn-soft" onClick={locate} disabled={locating}><Icon name="locate" size={20} />{locating ? "Đang lấy…" : "Vị trí của tôi"}</button>
            </span>
            {locError && <small className="fld-err" role="status">{locError}</small>}
          </label>
          <fieldset className="fld">
            <legend>Khi nào thợ tới?</legend>
            <div className="chips-pick">
              {[...TIMES, "Chọn giờ"].map((t) => (
                <label key={t} className={`pick${f.gio === t ? " on" : ""}`}>
                  <input type="radio" name="gio" value={t} checked={f.gio === t} onChange={set("gio")} />{t}
                </label>
              ))}
            </div>
            {f.gio === "Chọn giờ" && <input aria-label="Giờ hẹn" type="datetime-local" required value={f.gioCuThe} onChange={set("gioCuThe")} />}
          </fieldset>
          <div className="two">
            <label className="fld">Hãng, dòng, đời xe<input required placeholder="Ví dụ: Toyota Vios 2019" value={f.xe} onChange={set("xe")} /></label>
            <label className="fld"><span>Biển số <small>(không bắt buộc)</small></span><input placeholder="30A-123.45" value={f.bienSo} onChange={set("bienSo")} /></label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bk-fields">
          <label className="fld">Số điện thoại
            <input required type="tel" inputMode="tel" autoComplete="tel" pattern="[0-9 +.]{9,15}" placeholder="09xx xxx xxx" value={f.sdt} onChange={set("sdt")} />
          </label>
          <label className="fld"><span>Tình trạng xe <small>(không bắt buộc)</small></span>
            <textarea rows={3} placeholder="Ví dụ: đề không nổ, đèn taplo mờ" value={f.ghiChu} onChange={set("ghiChu")} />
          </label>
          <dl className="bk-sum">
            <div><dt><Icon name="wrench" size={18} />Dịch vụ</dt><dd>{f.dichVu} <button type="button" className="link" onClick={() => go(0)}>Sửa</button></dd></div>
            <div><dt><Icon name="pin" size={18} />Vị trí</dt><dd>{f.viTri} <button type="button" className="link" onClick={() => go(1)}>Sửa</button></dd></div>
            <div><dt><Icon name="clock" size={18} />Thời gian</dt><dd>{gio}</dd></div>
            <div><dt><Icon name="car" size={18} />Xe</dt><dd>{f.xe} {f.bienSo}</dd></div>
          </dl>
          <p className="bk-note"><Icon name="receipt" size={18} />Thợ gọi báo giá trước. Bạn đồng ý thì thợ mới làm.</p>
        </div>
      )}

      <div className="bk-nav">
        {step > 0 && <button type="button" className="btn btn-soft" onClick={() => go(step - 1)}><Icon name="back" size={20} />Quay lại</button>}
        {step > 0 && (
          <button className="btn btn-primary btn-grow" type="submit" disabled={state === "sending"}>
            {step < 2 ? <>Tiếp tục <Icon name="arrow" size={20} /></> : state === "sending" ? "Đang gửi…" : "Gửi lịch hẹn"}
          </button>
        )}
      </div>

      {state === "error" && <p className="notice" role="alert">Chưa gửi được. Thử lại, hoặc gọi {hotline || "hotline"} để đặt ngay.</p>}
      {state === "offline" && (
        <div className="notice" role="status">
          <p><b>Hệ thống nhận lịch online sắp mở.</b> Gửi nội dung dưới đây qua Zalo hoặc đọc khi gọi hotline:</p>
          <p className="bk-copy">{summary}</p>
          <div className="row-btns">
            <button type="button" className="btn btn-soft" onClick={copy}><Icon name="copy" size={18} />{copied ? "Đã chép" : "Chép nội dung"}</button>
            {zalo && <a className="btn btn-zalo" href={zalo} target="_blank" rel="noopener"><Icon name="chat" size={18} />Mở Zalo</a>}
            {telHref && <a className="btn btn-primary" href={telHref}><Icon name="phone" size={18} />Gọi {hotline}</a>}
          </div>
        </div>
      )}
    </form>
  );
}
