"use client";
// Màn TraCuuXe (/tra-cuu-xe/): biển số → mã 6 số qua Zalo (hoặc SMS) tới số đã đặt sửa xe → lịch sử, bảo hành còn lại,
// mốc bảo dưỡng tiếp theo. Phiên xem 30 phút giữ trong sessionStorage của tab (đóng tab là hết).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { lopForm } from "@/components/chung/Form";
import { goiApi } from "./hoi-lai";
import { ngay, so, vietTat } from "./dinh-dang";
import s from "./TraCuuXe.module.css";

const KHOA_PHIEN = "thotoi-tra-cuu-phien";
const BUOC = ["Biển số", "Mã Zalo", "Lịch sử"];
const docPhien = () => { try { return sessionStorage.getItem(KHOA_PHIEN) || ""; } catch { return ""; } };
const ghiPhien = (v) => { try { if (v) sessionStorage.setItem(KHOA_PHIEN, v); else sessionStorage.removeItem(KHOA_PHIEN); } catch { /* bỏ qua */ } };
const phut = (giay) => `${Math.floor(giay / 60)}:${String(giay % 60).padStart(2, "0")}`;
/** "http://…/dat-lich/?dv=bao-duong-dinh-ky" → "/dat-lich/?dv=bao-duong-dinh-ky" */
const duongDanTrong = (u, macDinh) => { try { const x = new URL(u, "http://x"); return x.pathname + x.search; } catch { return macDinh; } };

const IconZalo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
  </svg>
);

function LichSu({ ls, camKet, onThoat, dangThoat, tieuDeRef }) {
  const bd = ls.baoDuongTiepTheo || {};
  const dieuKien = [bd.ngayDuKien ? <>Khoảng <b>{ngay(bd.ngayDuKien)}</b></> : null, bd.conKm != null ? <>khi xe chạy thêm <b>{so(bd.conKm)} km</b></> : null].filter(Boolean);
  return (
    <div className={s.cot}>
      <h1 ref={tieuDeRef} tabIndex={-1} className="sr-only">Lịch sử xe {ls.xe.bienSo}</h1>
      <div className={s.theXe}>
        <div className={s.xeDau}>
          <div className={s.xeTen}>
            <span>{[ls.xe.ten, ls.xe.doi].filter(Boolean).join(" ") || "Xe của bạn"}</span>
            <b>{ls.xe.bienSo}</b>
          </div>
          <span className={s.daXacMinh}>Đã xác minh</span>
        </div>
        <dl className={s.soLieu}>
          <div><dt>km gần nhất</dt><dd>{ls.kmGanNhat != null ? so(ls.kmGanNhat) : "—"}</dd></div>
          <div><dt>lần sửa</dt><dd>{ls.soLanSua}</dd></div>
          <div><dt>còn bảo hành</dt><dd>{ls.soConBaoHanh}</dd></div>
        </dl>
        {ls.hoiVien ? <span className={s.hoiVien}>Hội viên {ls.hoiVien.goi}{ls.hoiVien.hetHan ? ` · đến ${ngay(ls.hoiVien.hetHan)}` : ""}</span> : null}
      </div>

      <section className={s.baoDuong} aria-labelledby="tieu-de-bao-duong">
        <span className={s.nhanCam}>BẢO DƯỠNG TIẾP THEO</span>
        <h2 id="tieu-de-bao-duong">{bd.mocKm ? `Mốc ${so(bd.mocKm)} km: bảo dưỡng định kỳ` : "Bảo dưỡng định kỳ"}</h2>
        <span className={s.chuPhu2}>
          {dieuKien.length === 2 ? <>{dieuKien[0]}, hoặc {dieuKien[1]}, tùy cái nào đến trước.</>
            : dieuKien.length === 1 ? <>{dieuKien[0]}.</>
              : "Đặt lịch để thợ kiểm tra và ghi mốc bảo dưỡng cho xe."}
        </span>
        <Link className="nut nut-chinh nut-day" href={duongDanTrong(bd.datLich, "/dat-lich/")}>Đặt lịch bảo dưỡng</Link>
      </section>

      <section className={s.cot} aria-labelledby="tieu-de-bh">
        <h2 id="tieu-de-bh" className={s.tieuDe2}>Bảo hành còn lại</h2>
        <p className={s.chuThich}>
          {camKet?.baoHanhPhuTungThang ? `Phụ tùng ${camKet.baoHanhPhuTungThang} tháng, công sửa ${camKet.baoHanhCongThang} tháng. ` : ""}
          Tính đến hôm nay {ngay(new Date())}.
        </p>
        {ls.baoHanh.length ? ls.baoHanh.map((w, i) => (
          <div key={`${w.maPhieu}-${i}`} className={s.theBh}>
            <div className={s.bhDau}>
              <b>{w.ten}</b>
              <b className={w.hetHan ? s.conHet : w.phanTram >= 40 ? s.conNhieu : s.conIt}>{w.hetHan ? "Hết hạn" : `còn ${w.conNgay} ngày`}</b>
            </div>
            <div className={s.thanh} role="progressbar" aria-label={`Thời hạn bảo hành còn lại: ${w.ten}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={w.phanTram}>
              <div className={w.phanTram >= 40 ? s.thanhXanh : s.thanhCam} style={{ width: `${w.phanTram}%` }} />
            </div>
            <span className={s.chuThich}>
              {w.hetHan ? `Hết hạn ngày ${ngay(w.denNgay)}` : `${ngay(w.tuNgay)} – ${ngay(w.denNgay)}`}{w.maDon ? ` · đơn ${w.maDon}` : ""}
            </span>
          </div>
        )) : <p className={s.theTrong}>Xe chưa có hạng mục bảo hành nào.</p>}
      </section>

      <section className={s.cot} aria-labelledby="tieu-de-ls">
        <h2 id="tieu-de-ls" className={s.tieuDe2}>Các lần sửa</h2>
        {ls.lichSu.length ? ls.lichSu.map((h) => (
          <article key={h.ma} className={s.lanSua}>
            <div className={s.lsDau}><b>{ngay(h.ngay)}</b><span>{h.ma}</span></div>
            {h.viec ? <span className={s.viec}>{h.viec}</span> : null}
            <div className={s.lsTho}>
              {h.tho ? <span className={s.anhTho} aria-hidden="true">{vietTat(h.tho)}</span> : null}
              <span className={s.tenTho}>{h.tho ? `Thợ ${h.tho}` : ""}</span>
              {h.km != null ? <b>{so(h.km)} km</b> : null}
            </div>
            <div className={s.lsChan}>
              <span>Đã thanh toán <b>{h.soTienHienThi || "—"}</b></span>
              {h.hoaDon?.linkPdf ? <a href={h.hoaDon.linkPdf} target="_blank" rel="noopener">Hóa đơn</a>
                : h.hoaDon?.so ? <span>HĐ số {h.hoaDon.so}</span> : null}
            </div>
          </article>
        )) : <p className={s.theTrong}>Chưa có lần sửa nào hoàn tất.</p>}
      </section>

      <button type="button" className={s.nutVien} onClick={onThoat} disabled={dangThoat}>Thoát, tra xe khác</button>
      <p className={s.chuThichGiua}>Phiên xem tự đóng sau {ls.phienHetHanPhut || 30} phút không dùng.</p>
    </div>
  );
}

export default function TraCuuXe({ hotline, camKet }) {
  const [buoc, setBuoc] = useState(1);
  const [bienSo, setBienSo] = useState("");
  const [loiBienSo, setLoiBienSo] = useState("");
  const [gui, setGui] = useState(null); // kết quả gửi mã
  const [ma, setMa] = useState("");
  const [loiMa, setLoiMa] = useState("");
  const [dem, setDem] = useState(0);
  const [ls, setLs] = useState(null);
  const [dang, setDang] = useState(false);
  const [baoChung, setBaoChung] = useState("");
  const tieuDeRef = useRef(null);
  const daDoiBuoc = useRef(false);

  const vaoBuoc = (n) => { daDoiBuoc.current = true; setBuoc(n); };
  useEffect(() => { if (daDoiBuoc.current) tieuDeRef.current?.focus(); }, [buoc]);

  // Đếm ngược gửi lại mã
  useEffect(() => {
    if (dem <= 0) return undefined;
    const t = setTimeout(() => setDem((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [dem]);

  const taiLichSu = async (phien) => {
    const r = await goiApi("/api/tra-cuu-xe/lich-su", { headers: { Authorization: `Phien ${phien}` } });
    if (r.ok) { setLs(r.json); vaoBuoc(3); return true; }
    ghiPhien("");
    if (r.status === 401) { setBaoChung(r.json.loi || "Phiên xem đã đóng. Nhập lại biển số."); setLs(null); vaoBuoc(1); }
    return false;
  };

  // Còn phiên trong tab (tải lại trang) thì mở thẳng lịch sử
  useEffect(() => {
    const p = docPhien();
    if (p) taiLichSu(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guiMa = async (kenh = "zalo") => {
    setBaoChung("");
    if (!bienSo.trim()) { setLoiBienSo("Nhập biển số xe, ví dụ 30A-123.45."); return; }
    setDang(true);
    const r = await goiApi("/api/tra-cuu-xe/gui-ma", { method: "POST", body: { bienSo: (gui?.bienSo && buoc === 2) ? gui.bienSo : bienSo, kenh } });
    setDang(false);
    if (r.ok) {
      setGui(r.json); setMa(""); setLoiMa(""); setLoiBienSo("");
      setDem(r.json.guiLaiSauGiay || 45);
      if (buoc !== 2) vaoBuoc(2);
      return;
    }
    const loi = r.json.loi || "Chưa gửi được mã, thử lại sau ít phút.";
    if (r.json.guiLaiSauGiay) setDem(r.json.guiLaiSauGiay);
    if (buoc === 2) setLoiMa(loi); else setLoiBienSo(loi);
  };

  const xacNhan = async (e) => {
    e?.preventDefault();
    if (!/^\d{6}$/.test(ma)) { setLoiMa("Nhập đủ 6 số trong tin nhắn."); return; }
    setDang(true);
    const r = await goiApi("/api/tra-cuu-xe/xac-nhan", { method: "POST", body: { bienSo: gui.bienSo, ma } });
    if (!r.ok) { setDang(false); setLoiMa(r.json.loi || "Mã chưa đúng."); return; }
    ghiPhien(r.json.phien);
    await taiLichSu(r.json.phien);
    setDang(false);
  };

  const thoat = async () => {
    setDang(true);
    const p = docPhien();
    if (p) await goiApi("/api/tra-cuu-xe/thoat", { method: "POST", headers: { Authorization: `Phien ${p}` } });
    ghiPhien("");
    setDang(false);
    setLs(null); setGui(null); setBienSo(""); setMa(""); setDem(0);
    vaoBuoc(1);
  };

  const kenhSms = gui?.kenh === "sms";

  return (
    <div className={s.trang}>
      <ol className={s.buoc} aria-label="Các bước tra cứu">
        {BUOC.map((ten, i) => (
          <li key={ten} className={i + 1 <= buoc ? s.buocQua : undefined} aria-current={i + 1 === buoc ? "step" : undefined}>
            <span className={s.vach} aria-hidden="true" />
            <span className={i + 1 === buoc ? s.buocNay : undefined}>{ten}</span>
          </li>
        ))}
      </ol>

      <div className={`wrap-hep ${s.than}`}>
        {baoChung ? <p className="bao bao-vang" role="status">{baoChung}</p> : null}

        {buoc === 1 ? (
          <form className={s.cot} onSubmit={(e) => { e.preventDefault(); guiMa("zalo"); }} noValidate>
            <h1 ref={tieuDeRef} tabIndex={-1}>Tra cứu lịch sử xe</h1>
            <p className={s.moDau}>Xem lại xe đã sửa gì, bảo hành còn bao lâu, khi nào bảo dưỡng tiếp. Không cần tạo tài khoản hay nhớ mật khẩu.</p>
            <div className={lopForm.truong}>
              <label htmlFor="bien-so" className={lopForm.nhan}>Biển số xe</label>
              <input
                id="bien-so" name="bienSo" className={`${s.oBienSo} ${loiBienSo ? s.oLoi : ""}`} value={bienSo}
                placeholder="30A-123.45" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={14}
                onChange={(e) => { setBienSo(e.target.value.toUpperCase()); if (loiBienSo) setLoiBienSo(""); }}
                aria-invalid={loiBienSo ? true : undefined} aria-describedby={loiBienSo ? "bien-so-loi" : "bien-so-goi-y"}
              />
              {loiBienSo
                ? <span id="bien-so-loi" className={s.loi} role="alert">{loiBienSo}</span>
                : <span id="bien-so-goi-y" className={s.goiY}>Gõ liền cũng được, hệ thống tự thêm dấu.</span>}
            </div>
            <button type="submit" className={`nut nut-zalo nut-lon nut-day ${s.nutZalo}`} disabled={dang} aria-busy={dang || undefined}>
              <IconZalo /> {dang ? "Đang gửi mã…" : "Gửi mã xác nhận qua Zalo"}
            </button>
            <div className={s.theVi}>
              <b>Vì sao cần mã?</b>
              <span>Mã 6 số gửi vào Zalo của số điện thoại đã dùng khi đặt sửa xe này. Chỉ chủ xe mới xem được lịch sử, người khác biết biển số cũng không xem được.</span>
              <span className={s.chuPhu}>Đổi số điện thoại? Gọi {hotline || "tổng đài"} để cập nhật.</span>
            </div>
            <ul className={s.baO}>
              <li><b>Các lần sửa</b>ngày, việc, thợ</li>
              <li><b>Bảo hành</b>còn bao lâu</li>
              <li><b>Lịch tới</b>bảo dưỡng</li>
            </ul>
          </form>
        ) : null}

        {buoc === 2 && gui ? (
          <form className={s.cot} onSubmit={xacNhan} noValidate>
            <button type="button" className={s.quayLai} onClick={() => { setLoiMa(""); vaoBuoc(1); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
              Đổi biển số
            </button>
            <h1 ref={tieuDeRef} tabIndex={-1}>{kenhSms ? "Nhập mã trong tin nhắn" : "Nhập mã trong Zalo"}</h1>
            <div className={s.daGui} role="status">
              <span className={s.oZalo} aria-hidden="true"><IconZalo /></span>
              <span>
                Đã gửi mã 6 số {kenhSms ? "qua SMS tới" : "vào Zalo của"} số <b>{gui.sdtChe}</b> (chủ xe <b>{gui.bienSo}</b>).
                Mã dùng được trong {gui.hetHanPhut || 5} phút.
              </span>
            </div>
            <div className={lopForm.truong}>
              <label htmlFor="ma-xac-nhan" className={lopForm.nhan}>Mã xác nhận 6 số</label>
              <input
                id="ma-xac-nhan" name="ma" className={`${s.oMa} ${loiMa ? s.oLoi : ""}`} value={ma}
                inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}"
                onChange={(e) => { setMa(e.target.value.replace(/\D/g, "").slice(0, 6)); if (loiMa) setLoiMa(""); }}
                aria-invalid={loiMa ? true : undefined} aria-describedby={loiMa ? "ma-loi" : undefined}
              />
              {loiMa ? <span id="ma-loi" className={s.loi} role="alert">{loiMa}</span> : null}
            </div>
            <button type="submit" className="nut nut-chinh nut-lon nut-day" disabled={dang} aria-busy={dang || undefined}>
              {dang ? "Đang kiểm tra…" : "Xem lịch sử xe"}
            </button>
            <div className={s.guiLai}>
              <span>Chưa nhận được mã?</span>
              {dem > 0
                ? <span aria-live="off">Gửi lại sau <b>{phut(dem)}</b></span>
                : <button type="button" className={s.nutChu} onClick={() => guiMa(gui.kenh || "zalo")} disabled={dang}>Gửi lại mã</button>}
            </div>
            {!kenhSms ? (
              <button type="button" className={s.nutChu} onClick={() => guiMa("sms")} disabled={dang || dem > 0}>
                Không dùng Zalo? Nhận mã qua SMS{dem > 0 ? ` (sau ${phut(dem)})` : ""}
              </button>
            ) : null}
          </form>
        ) : null}

        {buoc === 3 && ls ? <LichSu ls={ls} camKet={camKet} onThoat={thoat} dangThoat={dang} tieuDeRef={tieuDeRef} /> : null}
      </div>
    </div>
  );
}
