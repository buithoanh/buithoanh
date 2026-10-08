"use client";
// Form đặt lịch tối thiểu gửi vào POST /api/don-hang/dat-lich (xem docs/api.md).
// Phiên frontend sẽ thay bằng luồng 4 bước theo thiết kế DatLich.
import { useMemo, useState } from "react";

const empty = { dichVu: "", hang: "", dong: "", doi: "", bienSo: "", diaChi: "", choDo: "nha", ngayKhung: "", hoTen: "", sdt: "", ghiChu: "", dongY: false, website: "" };

export default function BookingForm({ duLieu, endpoint, hotline }) {
  const [f, setF] = useState(empty);
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [loi, setLoi] = useState({ chung: "", truong: {} });
  const [ketQua, setKetQua] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value, ...(k === "hang" ? { dong: "" } : {}) });
  const dongXe = useMemo(() => duLieu.hangXe.find((h) => h.slug === f.hang)?.dong || [], [f.hang, duLieu.hangXe]);

  async function submit(e) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    const [ngay, ma] = f.ngayKhung.split("|");
    const nguon = Object.fromEntries(new URLSearchParams(window.location.search));
    const body = {
      dichVu: [f.dichVu], trieuChung: f.ghiChu,
      xe: { hang: f.hang, dong: f.dong, doi: f.doi, bienSo: f.bienSo },
      viTri: { diaChi: f.diaChi, choDo: f.choDo },
      khungGio: { ngay, ma },
      khach: { hoTen: f.hoTen, sdt: f.sdt },
      dongY: f.dongY, maGioiThieu: nguon.ma || "",
      nguon: { ...nguon, trangVao: window.location.pathname, referrer: document.referrer },
      website: f.website,
    };
    try {
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { setKetQua(j); setState("sent"); return; }
      setLoi({ chung: j.loi || "", truong: j.truong || {} });
      setState("error");
    } catch { setLoi({ chung: "", truong: {} }); setState("error"); }
  }

  if (state === "sent" && ketQua) {
    return (
      <div className="notice">
        <p><b>Đã nhận yêu cầu. Mã đơn {ketQua.ma}.</b> Chúng tôi sẽ gọi lại số {f.sdt} để xác nhận.</p>
        {ketQua.giaSoBo && <p>Giá sơ bộ: {ketQua.giaSoBo.hienThi}. {ketQua.giaSoBo.ghiChu}</p>}
        <p><a href={ketQua.linkTheoDoi}>Xem trạng thái đơn</a></p>
      </div>
    );
  }
  const L = ({ k }) => (loi.truong[k] ? <span className="field-error">{loi.truong[k]}</span> : null);

  return (
    <form className="booking" onSubmit={submit} noValidate>
      <label htmlFor="dichVu">Dịch vụ cần làm
        <select id="dichVu" required value={f.dichVu} onChange={set("dichVu")}>
          <option value="">Chọn dịch vụ</option>
          {duLieu.dichVu.map((s) => <option key={s.slug} value={s.slug}>{s.ten}</option>)}
        </select><L k="dichVu" />
      </label>
      <div className="two">
        <label htmlFor="hang">Hãng xe
          <select id="hang" required value={f.hang} onChange={set("hang")}>
            <option value="">Chọn hãng</option>
            {duLieu.hangXe.map((h) => <option key={h.slug} value={h.slug}>{h.ten}</option>)}
          </select>
        </label>
        <label htmlFor="dong">Dòng xe
          <select id="dong" required value={f.dong} onChange={set("dong")} disabled={!f.hang}>
            <option value="">Chọn dòng</option>
            {dongXe.map((d) => <option key={d.slug} value={d.slug}>{d.ten}</option>)}
          </select><L k="xe.dong" />
        </label>
      </div>
      <div className="two">
        <label htmlFor="doi">Đời xe<input id="doi" inputMode="numeric" placeholder="2019" value={f.doi} onChange={set("doi")} /><L k="xe.doi" /></label>
        <label htmlFor="bienSo">Biển số<input id="bienSo" placeholder="30A-123.45 (gõ liền cũng được)" value={f.bienSo} onChange={set("bienSo")} /><L k="xe.bienSo" /></label>
      </div>
      <label htmlFor="diaChi">Vị trí xe<input id="diaChi" required placeholder="Số nhà, đường, phường, quận" value={f.diaChi} onChange={set("diaChi")} /><L k="viTri.diaChi" /></label>
      <div className="two">
        <label htmlFor="choDo">Xe đỗ ở đâu
          <select id="choDo" value={f.choDo} onChange={set("choDo")}>
            {duLieu.choDo.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label htmlFor="ngayKhung">Ngày và giờ
          <select id="ngayKhung" required value={f.ngayKhung} onChange={set("ngayKhung")}>
            <option value="">Chọn khung giờ</option>
            {duLieu.lich.map((n) => (
              <optgroup key={n.ngay} label={`${n.nhan} ${n.ngayThang}${n.nghi ? " (nghỉ)" : ""}`}>
                {n.khung.map((k) => <option key={k.ma} value={`${n.ngay}|${k.ma}`} disabled={!k.datDuoc}>{k.nhan}{k.day ? " (đã đầy)" : k.daQua ? " (đã qua)" : ""}</option>)}
              </optgroup>
            ))}
          </select><L k="khungGio" />
        </label>
      </div>
      <div className="two">
        <label htmlFor="hoTen">Họ tên<input id="hoTen" required value={f.hoTen} onChange={set("hoTen")} /><L k="khach.hoTen" /></label>
        <label htmlFor="sdt">Số điện thoại<input id="sdt" required type="tel" inputMode="tel" placeholder="09xx xxx xxx" value={f.sdt} onChange={set("sdt")} /><L k="khach.sdt" /></label>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set("website")} style={{ position: "absolute", left: "-9999px" }} />
      <label htmlFor="ghiChu">Tình trạng xe (không bắt buộc)<textarea id="ghiChu" rows={3} value={f.ghiChu} onChange={set("ghiChu")} /></label>
      <label className="check" htmlFor="dongY"><input id="dongY" type="checkbox" checked={f.dongY} onChange={set("dongY")} /> Tôi đồng ý cho xử lý dữ liệu cá nhân để phục vụ đơn này.<L k="dongY" /></label>
      <button className="btn btn-primary btn-lg" type="submit" disabled={state === "sending"}>{state === "sending" ? "Đang gửi…" : "Gửi yêu cầu"}</button>
      {state === "error" && <p className="notice">{loi.chung ? `${loi.chung} ` : "Chưa gửi được. "}Hoặc gọi {hotline || "hotline"} để đặt ngay.</p>}
    </form>
  );
}
