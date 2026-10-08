"use client";
// Giao diện quản trị: AI lập kế hoạch → quản trị góp ý / duyệt → AI viết bài → người duyệt đọc, góp ý / duyệt → bài lên web.
import { useCallback, useEffect, useMemo, useState } from "react";
import { marked } from "marked";

async function api(path, body) {
  const res = await fetch(`/api/quan-tri/${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json", "x-quan-tri": "1" } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({ loi: `Lỗi ${res.status}` }));
  if (!res.ok) throw new Error(res.status === 401 ? `${data.loi || "Chưa đăng nhập"} — tải lại trang để đăng nhập.` : data.loi || `Lỗi ${res.status}`);
  return data;
}

const TRANG_THAI = {
  "chua-viet": ["Chưa viết", ""],
  "dang-viet": ["AI đang viết", "qt-dang"],
  "cho-duyet": ["Chờ duyệt", "qt-cho"],
  "da-dang": ["Đã đăng", "qt-ok"],
};
const KIEM_TRA = { dat: ["Kiểm tra đạt", "qt-ok"], loi: ["Kiểm tra lỗi", "qt-loi"], "dang-chay": ["Đang kiểm tra", "qt-dang"], "khong-co": ["Chưa có kiểm tra", ""] };
const fmt = (s) => (s ? new Date(s).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }) : "");
const thangNay = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).slice(0, 7);

function Nhan({ kieu = "", children }) {
  return <span className={`qt-nhan ${kieu}`}>{children}</span>;
}

// Nội dung do AI viết hiển thị trong iframe sandbox (không chạy script, khác nguồn gốc) để không đụng tới phiên quản trị.
function KhungMarkdown({ md, cao = "70vh" }) {
  const html = useMemo(
    () => `<!doctype html><meta charset="utf-8"><style>
      body{font:16px/1.65 "Be Vietnam Pro",system-ui,sans-serif;color:#18212c;max-width:760px;margin:0 auto;padding:16px}
      h2,h3{color:#13283f;line-height:1.3} table{border-collapse:collapse} td,th{border:1px solid #e1e5ea;padding:4px 8px}
      a{color:#1d3a5a} img{max-width:100%} code{background:#f1f3f5;padding:0 4px;border-radius:4px}</style>${marked.parse(md || "")}`,
    [md],
  );
  return <iframe className="qt-khung" sandbox="" srcDoc={html} style={{ height: cao }} title="Xem nội dung" />;
}

function tachPhanDau(text) {
  const m = String(text || "").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { yaml: "", body: text || "", truong: {} };
  const truong = {};
  for (const line of m[1].split("\n")) {
    const k = line.match(/^([A-Za-z]+):\s*"?(.*?)"?\s*$/);
    if (k && k[2]) truong[k[1]] = k[2];
  }
  return { yaml: m[1], body: m[2], truong };
}

export default function QuanTri() {
  const [d, setD] = useState(null);
  const [loi, setLoi] = useState("");
  const [xem, setXem] = useState("ke-hoach");

  const tai = useCallback(() => api("tong-quan").then(setD, (e) => setLoi(e.message)), []);
  useEffect(() => {
    const doc = () => setXem(location.hash.slice(1) || "ke-hoach");
    doc();
    addEventListener("hashchange", doc);
    tai();
    return () => removeEventListener("hashchange", doc);
  }, [tai]);
  const coAIChay = d?.runs?.some((r) => r.trangThai !== "completed");
  useEffect(() => {
    if (!coAIChay) return;
    const t = setInterval(tai, 20000);
    return () => clearInterval(t);
  }, [coAIChay, tai]);

  if (loi && !d) return <div className="wrap qt"><p className="qt-thongbao qt-loi">{loi}</p></div>;
  if (!d) return <div className="wrap qt"><p>Đang tải…</p></div>;
  const laQuanTri = d.toi.vaiTro === "quan-tri";
  const soPR = xem.match(/^pr-(\d+)$/)?.[1];

  return (
    <div className="wrap qt">
      <div className="qt-dau">
        <h1>Quản trị nội dung</h1>
        <span className="qt-toi">{d.toi.email} · {laQuanTri ? "Quản trị" : "Duyệt bài"}</span>
      </div>
      {soPR ? (
        <ChiTietPR so={soPR} laQuanTri={laQuanTri} onXong={() => { tai(); location.hash = ""; }} />
      ) : (
        <>
          <nav className="qt-tabs" aria-label="Mục quản trị">
            <a href="#ke-hoach" aria-current={xem === "ke-hoach" ? "page" : undefined}>Kế hoạch SEO</a>
            <a href="#bai" aria-current={xem === "bai" ? "page" : undefined}>Bài chờ duyệt ({d.baiPR.length})</a>
            <a href="#ai" aria-current={xem === "ai" ? "page" : undefined}>AI {coAIChay ? "· đang làm" : ""}</a>
          </nav>
          {loi && <p className="qt-thongbao qt-loi">{loi}</p>}
          {xem === "bai" ? <TabBai d={d} /> : xem === "ai" ? <TabAI d={d} /> : <TabKeHoach d={d} laQuanTri={laQuanTri} tai={tai} />}
        </>
      )}
    </div>
  );
}

function TabKeHoach({ d, laQuanTri, tai }) {
  const daCo = new Set([...d.baiKeHoach.map((b) => b.thang), ...d.keHoachPR.map((p) => p.thang), ...d.thangDangLap]);
  const thangTrong = d.lichDang.map((l) => l.thang).filter((t) => t >= thangNay() && !daCo.has(t));
  const [thang, setThang] = useState(thangTrong[0] || "");
  const [dinhHuong, setDinhHuong] = useState("");
  const [chon, setChon] = useState(new Set());
  const [bao, setBao] = useState("");
  const [ban, setBan] = useState(false);

  const nhom = useMemo(() => {
    const m = new Map();
    for (const b of d.baiKeHoach) m.set(b.thang, [...(m.get(b.thang) || []), b]);
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [d.baiKeHoach]);

  async function lam(body, xong) {
    setBan(true);
    setBao("");
    try {
      const r = await api("chay", body);
      setBao(`Đã giao ${r.soLuot} việc cho AI. Thường mất 5–20 phút; trang tự cập nhật.`);
      xong?.();
      tai();
    } catch (e) {
      setBao(e.message);
    } finally {
      setBan(false);
    }
  }

  return (
    <>
      {bao && <p className="qt-thongbao">{bao}</p>}
      {laQuanTri && (
        <section className="qt-the">
          <h2>AI lập kế hoạch tháng mới</h2>
          {thangTrong.length ? (
            <form onSubmit={(e) => { e.preventDefault(); lam({ viec: "lap-ke-hoach", thang, gopY: dinhHuong }, () => setDinhHuong("")); }}>
              <label>Tháng{" "}
                <select value={thang} onChange={(e) => setThang(e.target.value)}>
                  {thangTrong.map((t) => {
                    const l = d.lichDang.find((x) => x.thang === t);
                    return <option key={t} value={t}>{t} — {l.baiCamNang} bài{l.chuDe ? `, ${l.chuDe}` : ""}</option>;
                  })}
                </select>
              </label>
              <label className="qt-khoi">Định hướng cho AI (không bắt buộc)
                <textarea rows={3} value={dinhHuong} onChange={(e) => setDinhHuong(e.target.value)} placeholder="Ví dụ: ưu tiên phanh và điều hoà; tránh chủ đề xe điện tháng này" />
              </label>
              <button className="btn btn-primary" disabled={ban || !thang}>AI lập kế hoạch</button>
            </form>
          ) : (
            <p className="qt-mo">Các tháng trong lịch đăng đều đã có kế hoạch hoặc đang lập.</p>
          )}
        </section>
      )}

      <section className="qt-the">
        <h2>Kế hoạch chờ duyệt</h2>
        {d.keHoachPR.length ? (
          <ul className="qt-ds">
            {d.keHoachPR.map((p) => (
              <li key={p.so}><a href={`#pr-${p.so}`}>{p.tieuDe}</a> {p.dangChay && <Nhan kieu="qt-dang">AI đang sửa</Nhan>} <span className="qt-mo">cập nhật {fmt(p.capNhat)}</span></li>
            ))}
          </ul>
        ) : (
          <p className="qt-mo">Không có kế hoạch nào chờ duyệt{d.thangDangLap.length ? ` (AI đang lập: ${d.thangDangLap.join(", ")})` : ""}.</p>
        )}
      </section>

      <section className="qt-the">
        <h2>Kế hoạch đã duyệt</h2>
        {!nhom.length && <p className="qt-mo">Chưa có tháng nào được duyệt.</p>}
        {nhom.map(([t, bai]) => (
          <div key={t} className="qt-thang">
            <h3>Tháng {t}</h3>
            <div className="qt-bang-cuon">
              <table className="qt-bang">
                <thead><tr>{laQuanTri && <th aria-label="Chọn" />}<th>Bài</th><th>Từ khoá</th><th>Nhóm</th><th>Tư liệu</th><th>Trạng thái</th></tr></thead>
                <tbody>
                  {bai.map((b) => {
                    const [ten, kieu] = TRANG_THAI[b.trangThai];
                    return (
                      <tr key={b.slug}>
                        {laQuanTri && (
                          <td><input type="checkbox" aria-label={`Chọn ${b.slug}`} disabled={b.trangThai !== "chua-viet"} checked={chon.has(b.slug)}
                            onChange={(e) => { const s = new Set(chon); e.target.checked ? s.add(b.slug) : s.delete(b.slug); setChon(s); }} /></td>
                        )}
                        <td><b>{b.tieuDe}</b><br /><span className="qt-mo">{b.slug}</span></td>
                        <td data-nhan="Từ khoá">{b.tuKhoa}</td>
                        <td data-nhan="Nhóm">{b.nhom}</td>
                        <td data-nhan="Tư liệu">{b.tuLieu || "—"}</td>
                        <td>{b.pr ? <a href={`#pr-${b.pr}`}><Nhan kieu={kieu}>{ten}</Nhan></a> : <Nhan kieu={kieu}>{ten}</Nhan>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {laQuanTri && nhom.length > 0 && (
          <button className="btn btn-primary" disabled={ban || !chon.size} onClick={() => lam({ viec: "viet-bai", slugs: [...chon] }, () => setChon(new Set()))}>
            AI viết {chon.size || ""} bài đã chọn
          </button>
        )}
      </section>
    </>
  );
}

function TabBai({ d }) {
  if (!d.baiPR.length) return <p className="qt-the qt-mo">Không có bài nào chờ duyệt.</p>;
  return (
    <ul className="qt-ds qt-the">
      {d.baiPR.map((p) => (
        <li key={p.so}>
          <a href={`#pr-${p.so}`}>{p.tieuDe.replace(/^Bài mới:\s*/, "")}</a> {p.dangChay && <Nhan kieu="qt-dang">AI đang sửa</Nhan>}
          <span className="qt-mo"> · {p.slug} · cập nhật {fmt(p.capNhat)}</span>
        </li>
      ))}
    </ul>
  );
}

function TabAI({ d }) {
  const ten = { "lap-ke-hoach": "Lập kế hoạch", "sua-ke-hoach": "Sửa kế hoạch", "viet-bai": "Viết bài", "sua-bai": "Sửa bài" };
  return (
    <section className="qt-the">
      <h2>Các lượt AI gần đây</h2>
      {!d.runs.length && <p className="qt-mo">Chưa có lượt nào.</p>}
      <ul className="qt-ds">
        {d.runs.map((r, i) => {
          const [viec, ...con] = r.ten.split(" ");
          const kq = r.trangThai !== "completed" ? <Nhan kieu="qt-dang">Đang chạy</Nhan> : r.ketQua === "success" ? <Nhan kieu="qt-ok">Xong</Nhan> : <Nhan kieu="qt-loi">Lỗi</Nhan>;
          return <li key={i}>{kq} {ten[viec] || viec} {con.join(" ")} <span className="qt-mo">· {fmt(r.luc)} · <a href={r.url} target="_blank" rel="noreferrer">nhật ký</a></span></li>;
        })}
      </ul>
    </section>
  );
}

function ChiTietPR({ so, laQuanTri, onXong }) {
  const [p, setP] = useState(null);
  const [loi, setLoi] = useState("");
  const [gopY, setGopY] = useState("");
  const [ban, setBan] = useState(false);
  const tai = useCallback(() => api(`pr/${so}`).then((x) => { setP(x); setLoi(""); }, (e) => setLoi(e.message)), [so]);
  useEffect(() => { tai(); }, [tai]);
  useEffect(() => {
    if (!p?.dangChay && p?.kiemTra?.tongHop !== "dang-chay") return;
    const t = setInterval(tai, 20000);
    return () => clearInterval(t);
  }, [p?.dangChay, p?.kiemTra?.tongHop, tai]);

  async function lam(hanhDong) {
    const hoi = { duyet: p.loai === "bai" ? "Duyệt và đăng bài này lên web?" : "Duyệt kế hoạch này?", bo: "Bỏ hẳn, không dùng nữa?" }[hanhDong];
    if (hoi && !confirm(hoi)) return;
    setBan(true);
    setLoi("");
    try {
      await api(`pr/${so}`, { hanhDong, gopY, sha: p.sha });
      if (hanhDong === "yeu-cau-sua") {
        setGopY("");
        await tai();
      } else onXong();
    } catch (e) {
      setLoi(e.message);
    } finally {
      setBan(false);
    }
  }

  if (!p) return <div className="qt-the">{loi ? <p className="qt-thongbao qt-loi">{loi}</p> : "Đang tải…"} <p><a href="#">← Quay lại</a></p></div>;
  const duocThaoTac = p.loai === "bai" || laQuanTri;
  const [kt, ktKieu] = KIEM_TRA[p.kiemTra.tongHop];
  const bai = p.bai && tachPhanDau(p.bai.noiDung);

  return (
    <>
      <p><a href={p.loai === "bai" ? "#bai" : "#ke-hoach"}>← Quay lại</a></p>
      <section className="qt-the">
        <h2>{p.tieuDe}</h2>
        <p className="qt-hang">
          <Nhan kieu={ktKieu}>{kt}</Nhan>
          {p.dangChay && <Nhan kieu="qt-dang">AI đang sửa — đợi xong rồi đọc lại</Nhan>}
          {p.xungDot && <Nhan kieu="qt-loi">Xung đột với bản chính</Nhan>}
          {p.fileSai.length > 0 && <Nhan kieu="qt-loi">Đổi file ngoài phạm vi: {p.fileSai.join(", ")}</Nhan>}
          <span className="qt-mo">cập nhật {fmt(p.capNhat)}</span>
          {p.xemTruoc && <a href={p.xemTruoc} target="_blank" rel="noreferrer">Xem trước như trên web ↗</a>}
          <a href={p.url} target="_blank" rel="noreferrer">GitHub ↗</a>
        </p>
      </section>

      {bai && (
        <section className="qt-the">
          <h2>Bài viết</h2>
          <dl className="qt-meta">
            {["title", "description", "keyword", "nhom"].map((k) => bai.truong[k] && (
              <div key={k}><dt>{k}</dt><dd>{bai.truong[k]} {(k === "title" || k === "description") && <span className="qt-mo">({bai.truong[k].length} ký tự)</span>}</dd></div>
            ))}
          </dl>
          <details><summary>Toàn bộ phần đầu bài</summary><pre className="qt-pre">{bai.yaml}</pre></details>
          <KhungMarkdown md={bai.body} />
        </section>
      )}

      {p.keHoach && (
        <section className="qt-the">
          <h2>Kế hoạch tháng {p.keHoach.thang}{p.keHoach.lich ? ` — lịch đăng ${p.keHoach.lich.baiCamNang} bài` : ""}</h2>
          {p.keHoach.suaNgoaiThang && <p className="qt-thongbao qt-loi">Kế hoạch này sửa cả tháng khác hoặc phần chung — không duyệt được ở đây.</p>}
          <p className="qt-mo">{p.keHoach.muc.length} bài{p.keHoach.daBo.length ? `, bỏ ${p.keHoach.daBo.length} bài so với bản trước` : ""}.</p>
          <div className="qt-bang-cuon">
            <table className="qt-bang">
              <thead><tr><th>Bài</th><th>Từ khoá</th><th>Lý do</th><th>Tư liệu</th></tr></thead>
              <tbody>
                {p.keHoach.muc.map((b) => (
                  <tr key={b.slug}>
                    <td>
                      <b>{b.tieuDe}</b> {b.thayDoi !== "giu" && <Nhan kieu="qt-cho">{b.thayDoi === "moi" ? "mới" : "đã sửa"}</Nhan>}
                      <br /><span className="qt-mo">{b.slug} · {b.nhom}{b.dichVuLienQuan?.length ? ` · ${b.dichVuLienQuan.join(", ")}` : ""}</span>
                    </td>
                    <td data-nhan="Từ khoá">
                      <b>{b.tuKhoa}</b>
                      {b.tuKhoaPhu?.length > 0 && <><br /><span className="qt-mo">{b.tuKhoaPhu.join(" · ")}</span></>}
                      {b.tuLoiKhach?.length > 0 && <><br /><span className="qt-mo">Lời khách: “{b.tuLoiKhach.join("”, “")}”</span></>}
                    </td>
                    <td data-nhan="Lý do">{b.lyDo}</td>
                    <td data-nhan="Tư liệu">{b.tuLieu || "—"}{b.nguon?.length ? <><br /><span className="qt-mo">{b.nguon.length} nguồn</span></> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="qt-the">
        <details open={p.loai === "ke-hoach"}>
          <summary>Ghi chú của AI (nguồn, chỗ cần điền, điểm cần kiểm)</summary>
          <KhungMarkdown md={p.moTa} cao="50vh" />
        </details>
      </section>

      <section className="qt-the">
        <h2>Góp ý ({p.gopY.length})</h2>
        {p.gopY.map((c, i) => (
          <div key={i} className="qt-gopy"><span className="qt-mo">{c.nguoi} · {fmt(c.luc)}</span><div className="qt-gopy-nd">{c.noiDung}</div></div>
        ))}
        {duocThaoTac ? (
          <>
            <label className="qt-khoi">Góp ý của bạn
              <textarea rows={4} value={gopY} onChange={(e) => setGopY(e.target.value)} placeholder="Ví dụ: mở bài ngắn lại; thêm câu hỏi về thời gian thay má phanh" />
            </label>
            {loi && <p className="qt-thongbao qt-loi">{loi}</p>}
            <div className="qt-hang">
              <button className="btn btn-ghost" disabled={ban || !gopY.trim()} onClick={() => lam("yeu-cau-sua")}>Yêu cầu AI sửa</button>
              <button className="btn btn-primary" disabled={ban || p.dangChay || p.kiemTra.tongHop !== "dat" && p.kiemTra.tongHop !== "khong-co"} onClick={() => lam("duyet")}>
                {p.loai === "bai" ? "Duyệt và đăng" : "Duyệt kế hoạch"}
              </button>
              <button className="btn qt-nut-bo" disabled={ban} onClick={() => lam("bo")}>Bỏ</button>
            </div>
          </>
        ) : (
          <p className="qt-mo">Chỉ quản trị viên duyệt kế hoạch.</p>
        )}
      </section>
    </>
  );
}
