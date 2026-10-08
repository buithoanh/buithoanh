"use client";
// Màn DanhGia (/don/[tokenDanhGia]/danh-gia/): link riêng, dùng một lần, gửi qua Zalo 24 giờ sau khi xong.
// 4–5 sao: lưu đánh giá, mời viết trên Google. 1–3 sao: chọn vấn đề, mô tả → phiếu khiếu nại KN- chuyển CSKH.
import { useRef, useState } from "react";
import Link from "next/link";
import DauDon from "@/components/chung/DauDon";
import { lopForm } from "@/components/chung/Form";
import TheTho from "./TheTho";
import LoiLink from "./LoiLink";
import { goiApi } from "./hoi-lai";
import { dongPhu, gio, ngay, telHref } from "./dinh-dang";
import s from "./phuc-vu.module.css";
import g from "./DanhGiaDon.module.css";

const CHU_SAO = ["", "Rất tệ", "Chưa tốt", "Tạm được", "Tốt", "Rất tốt"];
const SDT = /^(0|84)(3|5|7|8|9)\d{8}$/;
const chuanSdt = (v) => v.replace(/[\s.\-()+]/g, "");

function Sao() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2" />
    </svg>
  );
}

export default function DanhGiaDon({ token, banDau, linkGoogleMacDinh }) {
  const d = banDau;
  const [soSao, setSoSao] = useState(0);
  const [vanDe, setVanDe] = useState([]);
  const [moTa, setMoTa] = useState("");
  const [loiKhen, setLoiKhen] = useState("");
  const [sdt, setSdt] = useState("");
  const [loiSdt, setLoiSdt] = useState("");
  const [loi, setLoi] = useState("");
  const [dang, setDang] = useState(false);
  const [ketQua, setKetQua] = useState(null);
  const [daDanhGia, setDaDanhGia] = useState(d.daDanhGia);
  const [loiLink, setLoiLink] = useState(null);
  const ketQuaRef = useRef(null);

  if (loiLink) return <LoiLink status={loiLink} hotline={d.hotline} />;

  const tel = telHref(d.hotline);
  const kiemSdt = (v) => (!v.trim() || SDT.test(chuanSdt(v)) ? "" : "Số điện thoại chưa đúng, ví dụ 0912 345 678.");
  const tot = soSao >= 4;

  const gui = async () => {
    setLoi("");
    if (!tot) {
      const l = kiemSdt(sdt);
      setLoiSdt(l);
      if (l) { document.getElementById("sdt-goi")?.focus(); return; }
    }
    setDang(true);
    const body = tot
      ? { soSao, ...(loiKhen.trim() ? { moTa: loiKhen.trim() } : {}) }
      : { soSao, vanDe, moTa: moTa.trim(), ...(sdt.trim() ? { sdtGoiLai: chuanSdt(sdt) } : {}) };
    const r = await goiApi(`/api/don-hang/danh-gia/${token}`, { method: "POST", body });
    setDang(false);
    if (r.ok) {
      setKetQua(r.json);
      setTimeout(() => ketQuaRef.current?.focus(), 0);
      return;
    }
    if (r.status === 409) return setDaDanhGia(true);
    if (r.status === 404 || r.status === 410) return setLoiLink(r.status);
    if (r.json.truong?.sdtGoiLai) setLoiSdt(r.json.truong.sdtGoiLai);
    setLoi(r.json.loi || "Chưa gửi được, thử lại sau ít phút.");
  };

  const tenViec = (d.dichVu || []).join(", ");
  const dau = <DauDon tieuDe={`Đánh giá đơn ${d.ma}`} phu={dongPhu([d.xe?.ten, d.xe?.doi].filter(Boolean).join(" "), d.xe?.bienSo)} />;
  const theTho = (
    <section className={s.vung}>
      <TheTho
        tho={d.tho || { ten: "ThợTới" }} xeVan={false}
        tieuDe={dongPhu(d.tho?.ten ? `Thợ ${d.tho.ten}` : null, tenViec ? tenViec.toLowerCase() : null)}
        phu={dongPhu(ngay(d.ngay), d.noiLam ? `tại ${d.noiLam}` : null)}
      />
    </section>
  );
  const chan = (
    <>
      <div className={s.dayXuong} />
      <footer className={s.chan}>
        <span>Link đánh giá gửi qua Zalo 24 giờ sau khi sửa xong, chỉ dùng được một lần cho đơn {d.ma}.</span>
      </footer>
    </>
  );

  if (daDanhGia && !ketQua) {
    return (
      <>
        {dau}
        {theTho}
        <section className={s.ketQua}>
          <span className={s.vongXanh} aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </span>
          <h1>Bạn đã đánh giá đơn này</h1>
          <p>Cảm ơn bạn đã dành thời gian. Link đánh giá chỉ dùng được một lần.</p>
          {tel ? <a className={`${s.nutVien} nut-day`} href={tel}>Cần hỗ trợ thêm? Gọi {d.hotline}</a> : null}
        </section>
        {chan}
      </>
    );
  }

  const linkGoogle = ketQua?.linkGoogle || d.linkGoogle || linkGoogleMacDinh;

  return (
    <>
      {dau}
      {theTho}

      <section className={`${s.the} ${g.chamDiem}`}>
        <h1 className={g.cauHoi}>Lần sửa xe vừa rồi bạn thấy thế nào?</h1>
        <span className={g.goiY}>Chạm vào số sao. Mất chưa tới 1 phút.</span>
        <fieldset className={g.hangSao} disabled={Boolean(ketQua)}>
          <legend className="sr-only">Chấm điểm từ 1 đến 5 sao</legend>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={`${g.sao} ${n <= soSao ? g.saoSang : ""}`}>
              <input
                type="radio" name="so-sao" value={n} className="sr-only" checked={soSao === n}
                onChange={() => { setSoSao(n); setLoi(""); }}
              />
              <Sao />
              <span className="sr-only">{n} sao – {CHU_SAO[n]}</span>
            </label>
          ))}
        </fieldset>
        <b className={soSao === 0 ? g.chuaChon : tot ? g.chuTot : g.chuKem} aria-live="polite">
          {soSao === 0 ? "Chưa chọn" : `${soSao} sao · ${CHU_SAO[soSao]}`}
        </b>
      </section>

      {tot && !ketQua ? (
        <section className={g.hopTot}>
          <b className={g.tieuDeTot}>Bạn chấm {soSao} sao{d.tho?.ten ? ` cho thợ ${d.tho.ten}` : ""}</b>
          <div className={`${lopForm.truong} ${g.trai}`}>
            <label htmlFor="loi-khen" className={lopForm.nhan}>Vài lời khen gửi thợ (không bắt buộc)</label>
            <textarea id="loi-khen" className={lopForm.o} rows={3} maxLength={2000} value={loiKhen} onChange={(e) => setLoiKhen(e.target.value)} />
          </div>
          {loi ? <p className={`bao bao-loi ${g.trai}`} role="alert">{loi}</p> : null}
          <button type="button" className="nut nut-chinh nut-day nut-lon" onClick={gui} disabled={dang} aria-busy={dang || undefined}>
            {dang ? "Đang gửi…" : "Gửi đánh giá"}
          </button>
        </section>
      ) : null}

      {tot && ketQua ? (
        <section className={g.hopTot} aria-labelledby="cam-on">
          <span className={g.vongTrang} aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>
          </span>
          <b id="cam-on" ref={ketQuaRef} tabIndex={-1} className={g.camOn}>Cảm ơn bạn nhiều!</b>
          <span className={g.chuXanh}>
            Lời khen của bạn sẽ được gửi tới {d.tho?.ten ? `thợ ${d.tho.ten.split(/\s+/).pop()}` : "thợ"}.
            {linkGoogle ? " Nếu tiện, bạn viết vài dòng trên Google giúp ThợTới nhé. Người khác cần thợ gấp sẽ tìm thấy chúng tôi nhanh hơn." : ""}
          </span>
          {linkGoogle ? (
            <>
              <a className={`nut nut-chinh nut-day ${g.nutGoogle}`} href={linkGoogle} target="_blank" rel="noopener">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                Viết đánh giá trên Google
              </a>
              <span className={g.chuXanhNho}>Mở trang đánh giá Google của ThợTới. Bạn không cần gõ lại số sao ở đây.</span>
              <Link className={s.nutChu} href="/">Để sau</Link>
            </>
          ) : null}
        </section>
      ) : null}

      {soSao > 0 && !tot && !ketQua ? (
        <section className={`${s.the} ${g.hopKem}`}>
          <div className={g.dauKem}>
            <b>Xin lỗi vì chưa làm bạn hài lòng</b>
            <span>Bạn kể giúp chỗ nào chưa ổn. Bộ phận chăm sóc khách hàng sẽ gọi lại cho bạn.</span>
          </div>
          <fieldset className={g.vanDe}>
            <legend>Vấn đề bạn gặp (chọn một hoặc nhiều)</legend>
            <div className={g.dsChip}>
              {d.vanDe.map((v) => {
                const on = vanDe.includes(v.ma);
                return (
                  <button
                    key={v.ma} type="button" aria-pressed={on} className={`${g.chip} ${on ? g.chipBat : ""}`}
                    onClick={() => setVanDe(on ? vanDe.filter((x) => x !== v.ma) : [...vanDe, v.ma])}
                  >
                    {v.nhan}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className={lopForm.truong}>
            <label htmlFor="mo-ta" className={g.nhan}>Mô tả thêm</label>
            <textarea id="mo-ta" className={lopForm.o} rows={4} maxLength={2000} value={moTa} onChange={(e) => setMoTa(e.target.value)} placeholder="Chuyện gì đã xảy ra?" />
          </div>
          <div className={lopForm.truong}>
            <label htmlFor="sdt-goi" className={g.nhan}>Số điện thoại để gọi lại</label>
            <input
              id="sdt-goi" type="tel" inputMode="tel" autoComplete="tel" className={`${lopForm.o} ${loiSdt ? lopForm.oLoi : ""}`}
              value={sdt} placeholder="Để trống: gọi số đã đặt đơn"
              onChange={(e) => { setSdt(e.target.value); if (loiSdt) setLoiSdt(kiemSdt(e.target.value)); }}
              onBlur={() => setLoiSdt(kiemSdt(sdt))}
              aria-invalid={loiSdt ? true : undefined} aria-describedby={loiSdt ? "sdt-goi-loi" : "sdt-goi-goi-y"}
            />
            {loiSdt ? <span id="sdt-goi-loi" className={s.loi} role="alert">{loiSdt}</span> : <span id="sdt-goi-goi-y" className={s.ghiChu}>Để trống thì CSKH gọi số bạn đã dùng khi đặt đơn.</span>}
          </div>
          {loi ? <p className="bao bao-loi" role="alert">{loi}</p> : null}
          <button type="button" className="nut nut-chinh nut-day nut-lon" onClick={gui} disabled={dang} aria-busy={dang || undefined}>
            {dang ? "Đang gửi…" : "Gửi góp ý"}
          </button>
          <span className={`${s.ghiChu} ${s.giua}`}>Góp ý của bạn chỉ chuyển cho CSKH, không đăng công khai.</span>
        </section>
      ) : null}

      {!tot && ketQua ? (
        <section className={`${s.the} ${g.hopGui}`} aria-labelledby="da-chuyen">
          <span className={s.vongCam} aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
          </span>
          <b id="da-chuyen" ref={ketQuaRef} tabIndex={-1} className={g.camOnToi}>Đã chuyển CSKH</b>
          <span className={g.goiY}>
            {ketQua.cskh ? `${ketQua.cskh} bên chăm sóc khách hàng` : "Bộ phận chăm sóc khách hàng"} sẽ gọi lại cho bạn
            {ketQua.goiLaiTrongGio ? ` trong ${ketQua.goiLaiTrongGio} giờ` : ""}
            {ketQua.hanGoiLai ? ` (trước ${gio(ketQua.hanGoiLai)} ${ngay(ketQua.hanGoiLai) === ngay(ketQua.guiLuc) ? "hôm nay" : `ngày ${ngay(ketQua.hanGoiLai)}`})` : ""}.
          </span>
          <div className={g.tomTat}>
            <div className={s.hang}><span>Mã phiếu khiếu nại</span><b className={g.maPhieu}>{ketQua.maPhieu}</b></div>
            <div className={s.hang}><span>Đơn liên quan</span><b>{ketQua.maDon}</b></div>
            <div className={s.hang}><span>Số sao</span><b>{ketQua.soSao} / 5</b></div>
            <div className={s.hang}><span>Vấn đề</span><b>{(ketQua.vanDe || []).map((m) => d.vanDe.find((v) => v.ma === m)?.nhan || m).join(", ") || "Không chọn"}</b></div>
            {ketQua.guiLuc ? <div className={s.hang}><span>Gửi lúc</span><b>{gio(ketQua.guiLuc)} {ngay(ketQua.guiLuc)}</b></div> : null}
          </div>
          {tel ? <a className={`${s.nutVien} nut-day`} href={tel}>Cần gấp? Gọi {d.hotline}</a> : null}
        </section>
      ) : null}

      {chan}
    </>
  );
}
