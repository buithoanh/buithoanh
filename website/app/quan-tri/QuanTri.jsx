"use client";
// Trang quản trị: xem và xử lý lịch hẹn khách đặt trên web (lưu ở Cloudflare D1), lối vào trang soạn bài.
import { useCallback, useEffect, useState } from "react";

const API = "/api/quan-tri";
const STATUSES = [
  ["moi", "Mới"],
  ["da-goi", "Đã gọi"],
  ["dang-lam", "Đang làm"],
  ["xong", "Xong"],
  ["huy", "Huỷ"],
];
const label = Object.fromEntries(STATUSES);

const when = (s) => {
  if (!s) return "";
  // Giờ khách chọn trong form không kèm múi giờ (giờ Hà Nội): hiện nguyên, không đổi múi.
  const local = String(s).match(/^\d{4}-(\d{2})-(\d{2})T(\d{2}:\d{2})$/);
  if (local) return `${local[3]} ${local[2]}-${local[1]}`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

export default function QuanTri() {
  const [auth, setAuth] = useState("checking"); // checking | out | in
  const [rows, setRows] = useState([]);
  const [dem, setDem] = useState({});
  const [loc, setLoc] = useState("moi");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (loc) p.set("trangThai", loc);
    if (q.trim()) p.set("q", q.trim());
    try {
      const r = await fetch(`${API}/lich-hen?${p}`, { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (r.status === 401) { setAuth("out"); return; }
      if (!r.ok) { setAuth("in"); setMsg(d.loi || `Lỗi ${r.status}`); return; }
      setAuth("in"); setMsg(""); setRows(d.lichHen); setDem(d.dem);
    } catch {
      setAuth((a) => (a === "checking" ? "out" : a));
      setMsg("Không kết nối được máy chủ.");
    }
  }, [loc, q]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (auth !== "in") return;
    const t = setInterval(load, 60000); // tự làm mới mỗi phút để thấy lịch mới
    return () => clearInterval(t);
  }, [auth, load]);

  async function update(id, patch) {
    const r = await fetch(`${API}/lich-hen/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) return setAuth("out");
    if (!r.ok) return setMsg(d.loi || "Chưa lưu được.");
    setRows((rs) => rs.map((x) => (x.id === id ? d.lichHen : x)));
    load();
  }

  async function logout() {
    await fetch(`${API}/dang-nhap`, { method: "DELETE" });
    setAuth("out"); setRows([]);
  }

  if (auth === "checking") return <p>Đang tải…</p>;
  if (auth === "out") return <Login onDone={() => { setAuth("checking"); load(); }} note={msg} />;

  const total = Object.values(dem).reduce((a, b) => a + b, 0);
  return (
    <div className="admin">
      <div className="admin-head">
        <h1>Lịch hẹn</h1>
        <div className="admin-actions">
          <a className="btn btn-ghost" href="/quan-tri/bai-viet/">Soạn bài, sửa thông tin</a>
          <button className="btn btn-ghost" onClick={logout}>Đăng xuất</button>
        </div>
      </div>

      <div className="admin-filters" role="tablist">
        {STATUSES.map(([k, v]) => (
          <button key={k} role="tab" aria-selected={loc === k} className={loc === k ? "on" : ""} onClick={() => setLoc(k)}>
            {v} <span>{dem[k] || 0}</span>
          </button>
        ))}
        <button role="tab" aria-selected={loc === ""} className={loc === "" ? "on" : ""} onClick={() => setLoc("")}>Tất cả <span>{total}</span></button>
      </div>
      <form className="admin-search" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <input type="search" placeholder="Tìm số điện thoại, biển số, xe, địa chỉ" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>

      {msg && <p className="notice">{msg}</p>}
      {!msg && rows.length === 0 && <p className="meta">Không có lịch hẹn nào{loc ? ` ở mục “${label[loc]}”` : ""}.</p>}

      <ul className="admin-list">
        {rows.map((r) => <Row key={r.id} r={r} onUpdate={update} />)}
      </ul>
    </div>
  );
}

function Row({ r, onUpdate }) {
  const [note, setNote] = useState(r.ghi_chu_noi_bo || "");
  const tel = r.sdt.replace(/[^\d+]/g, "");
  return (
    <li className={`admin-item s-${r.trang_thai}`}>
      <div className="admin-top">
        <b>#{r.id} · {r.dich_vu}</b>
        <span className="meta">đặt {when(r.tao_luc)}</span>
      </div>
      <dl>
        <dt>Xe</dt><dd>{r.xe}{r.bien_so ? ` · ${r.bien_so}` : ""}</dd>
        <dt>Vị trí</dt><dd><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.vi_tri)}`} target="_blank" rel="noopener">{r.vi_tri}</a></dd>
        {r.gio && <><dt>Hẹn</dt><dd>{when(r.gio)}</dd></>}
        <dt>SĐT</dt><dd><a href={`tel:${tel}`}>{r.sdt}</a> · <a href={`https://zalo.me/${tel.replace(/^\+?84/, "0")}`} target="_blank" rel="noopener">Zalo</a></dd>
        {r.ghi_chu && <><dt>Khách ghi</dt><dd>{r.ghi_chu}</dd></>}
      </dl>
      <div className="admin-edit">
        <label>Trạng thái
          <select value={r.trang_thai} onChange={(e) => onUpdate(r.id, { trangThai: e.target.value })}>
            {STATUSES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Ghi chú nội bộ
          <input value={note} placeholder="Báo giá, thợ nhận việc…" onChange={(e) => setNote(e.target.value)}
            onBlur={() => note !== (r.ghi_chu_noi_bo || "") && onUpdate(r.id, { ghiChuNoiBo: note })} />
        </label>
      </div>
      {r.cap_nhat_luc && <p className="meta">Cập nhật {when(r.cap_nhat_luc)}</p>}
    </li>
  );
}

function Login({ onDone, note }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(note && note !== "Chưa đăng nhập." ? note : "");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${API}/dang-nhap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matKhau: pw }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) return onDone();
      setErr(r.status === 404 ? "Trang quản trị chỉ chạy trên Cloudflare Pages (chưa có máy chủ ở bản chạy thử)." : d.loi || `Lỗi ${r.status}`);
    } catch { setErr("Không kết nối được máy chủ."); }
    setBusy(false);
  }
  return (
    <form className="prose admin-login" onSubmit={submit}>
      <h1>Quản trị</h1>
      <label htmlFor="pw">Mật khẩu
        <input id="pw" type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} />
      </label>
      <button className="btn btn-primary" disabled={busy}>{busy ? "Đang vào…" : "Đăng nhập"}</button>
      {err && <p className="notice">{err}</p>}
      <p className="meta">Soạn bài cẩm nang, sửa hotline: <a href="/quan-tri/bai-viet/">đăng nhập bằng GitHub</a>.</p>
    </form>
  );
}
