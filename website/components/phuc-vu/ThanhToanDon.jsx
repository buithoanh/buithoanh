"use client";
// Màn ThanhToan (/don/[token]/thanh-toan/): hạng mục và tổng tiền, mã VietQR, chuyển khoản tay (sao chép từng dòng).
// Hỏi lại GET .../thanh-toan mỗi 5 giây khi tab đang mở; tiền về thì tự chuyển sang biên nhận, hoá đơn, bảo hành.
import { useRef, useState } from "react";
import Link from "next/link";
import DauDon from "@/components/chung/DauDon";
import Icon from "@/components/Icon";
import { lopForm } from "@/components/chung/Form";
import LoiLink from "./LoiLink";
import { goiApi, useHoiLai } from "./hoi-lai";
import { dongPhu, gio, ngay, telHref, tien } from "./dinh-dang";
import s from "./phuc-vu.module.css";
import t from "./ThanhToanDon.module.css";

const HOI_LAI_MS = 5000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function chepVao(chu) {
  try {
    await navigator.clipboard.writeText(chu);
    return true;
  } catch {
    // Trình duyệt cũ / không phải https: chép bằng ô ẩn
    const o = document.createElement("textarea");
    o.value = chu;
    o.setAttribute("readonly", "");
    o.style.position = "fixed";
    o.style.opacity = "0";
    document.body.appendChild(o);
    o.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { /* bỏ qua */ }
    o.remove();
    return ok;
  }
}

const IconChep = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const IconTai = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

function DongChep({ nhan, giaTri, chep, lop, daChep, onChep }) {
  return (
    <div className={t.dongChep}>
      <div className={t.dongChu}>
        <span>{nhan}</span>
        <b className={lop}>{giaTri}</b>
      </div>
      <button type="button" className={`${t.nutChep} ${daChep ? t.daChep : ""}`} onClick={() => onChep(chep ?? String(giaTri))} aria-label={`Sao chép ${nhan.toLowerCase()}`}>
        {daChep ? <Icon name="check" size={16} /> : <IconChep />}
        {daChep ? "Đã chép" : "Sao chép"}
      </button>
    </div>
  );
}

function HoaDon({ token, hoaDon, sdt, hotline }) {
  const [zalo, setZalo] = useState({ dang: false, xong: "", loi: "" });
  const [email, setEmail] = useState("");
  const [loiEmail, setLoiEmail] = useState("");
  const [mail, setMail] = useState({ dang: false, xong: false, loi: "" });

  const guiZalo = async () => {
    setZalo({ dang: true, xong: "", loi: "" });
    const r = await goiApi(`/api/don-hang/theo-doi/${token}/gui-hoa-don`, { method: "POST", body: { kenh: "zalo" } });
    setZalo(r.ok ? { dang: false, xong: r.json.toi || sdt || "", loi: "" } : { dang: false, xong: "", loi: r.json.loi || "Chưa gửi được, thử lại sau." });
  };
  const kiemEmail = (v) => (!v.trim() ? "Nhập email nhận hoá đơn." : EMAIL.test(v.trim()) ? "" : "Email chưa đúng, ví dụ ketoan@congty.vn.");
  const guiEmail = async (e) => {
    e.preventDefault();
    const l = kiemEmail(email);
    setLoiEmail(l);
    if (l) return;
    setMail({ dang: true, xong: false, loi: "" });
    const r = await goiApi(`/api/don-hang/theo-doi/${token}/gui-hoa-don`, { method: "POST", body: { kenh: "email", email: email.trim() } });
    if (!r.ok && r.json.truong?.email) setLoiEmail(r.json.truong.email);
    setMail(r.ok ? { dang: false, xong: true, loi: "" } : { dang: false, xong: false, loi: r.json.truong?.email ? "" : r.json.loi || "Chưa gửi được, thử lại sau." });
  };

  return (
    <section className={`${s.the} ${t.khoi}`} aria-labelledby="tieu-de-hoa-don">
      <div className={t.dauKhoi}>
        <span className={t.oIcon} aria-hidden="true"><Icon name="receipt" size={22} /></span>
        <div className={t.dauChu}>
          <h2 id="tieu-de-hoa-don">Hoá đơn điện tử</h2>
          <span>
            {hoaDon
              ? `Số ${hoaDon.so}${hoaDon.kyHieu ? ` · Ký hiệu ${hoaDon.kyHieu}` : ""}${hoaDon.maCQT ? " · đã có mã của cơ quan thuế" : ""}`
              : "Hoá đơn đang được xuất, xong sẽ gửi qua Zalo cho bạn."}
          </span>
        </div>
      </div>
      {hoaDon?.linkXem || hoaDon?.linkPdf ? (
        <div className={t.haiCot}>
          {hoaDon.linkXem ? <a className="nut nut-toi" href={hoaDon.linkXem} target="_blank" rel="noopener">Xem hoá đơn</a> : null}
          {hoaDon.linkPdf ? <a className={s.nutVien} href={hoaDon.linkPdf} target="_blank" rel="noopener" download>Tải PDF</a> : null}
        </div>
      ) : null}
      {hoaDon ? (
        <>
          <button type="button" className={zalo.xong ? t.nutXong : "nut nut-zalo"} onClick={guiZalo} disabled={zalo.dang} aria-live="polite">
            {zalo.dang ? "Đang gửi…" : zalo.xong ? `Đã gửi hoá đơn qua Zalo ${zalo.xong}` : "Gửi hoá đơn qua Zalo"}
          </button>
          {zalo.loi ? <span className={s.loi} role="alert">{zalo.loi}</span> : null}
          <form className={t.formEmail} onSubmit={guiEmail} noValidate>
            <label htmlFor="email-hd" className={t.nhanEmail}>Gửi thêm qua email (cho công ty)</label>
            <div className={t.hangEmail}>
              <input
                id="email-hd" type="email" inputMode="email" autoComplete="email" className={`${lopForm.o} ${loiEmail ? lopForm.oLoi : ""}`}
                value={email} placeholder="ketoan@congty.vn"
                onChange={(e) => { setEmail(e.target.value); if (loiEmail) setLoiEmail(kiemEmail(e.target.value)); setMail((m) => ({ ...m, xong: false })); }}
                onBlur={() => email && setLoiEmail(kiemEmail(email))}
                aria-invalid={loiEmail ? true : undefined} aria-describedby={loiEmail ? "email-hd-loi" : undefined}
              />
              <button type="submit" className={mail.xong ? t.nutXongNho : `${s.nutVien} ${t.nutGui}`} disabled={mail.dang}>
                {mail.dang ? "Đang gửi…" : mail.xong ? "Đã gửi" : "Gửi email"}
              </button>
            </div>
            {loiEmail ? <span id="email-hd-loi" className={s.loi} role="alert">{loiEmail}</span> : null}
            {mail.loi ? <span className={s.loi} role="alert">{mail.loi}</span> : null}
          </form>
        </>
      ) : null}
      <span className={s.ghiChu}>
        Cần xuất hoá đơn công ty? Gọi {hotline ? <a href={telHref(hotline)}>{hotline}</a> : "tổng đài"} trong 7 ngày để điều chỉnh tên và mã số thuế.
      </span>
    </section>
  );
}

export default function ThanhToanDon({ token, banDau, camKet }) {
  const [d, setD] = useState(banDau);
  const [loiLink, setLoiLink] = useState(null);
  const [daChep, setDaChep] = useState("");
  const [thongBao, setThongBao] = useState("");
  const hen = useRef(null);

  useHoiLai(async () => {
    const r = await goiApi(`/api/don-hang/theo-doi/${token}/thanh-toan`);
    if (r.ok) {
      if (r.json.daThanhToan && !d.daThanhToan) { setThongBao("Đã nhận tiền. Biên nhận, hoá đơn và bảo hành ở bên dưới."); window.scrollTo(0, 0); }
      else if (r.json.daNhan !== d.daNhan) setThongBao(`Đã nhận ${tien(r.json.daNhan)}, còn ${tien(r.json.conPhaiTra)}.`);
      setD(r.json);
    } else if (r.status === 404 || r.status === 410) setLoiLink(r.status);
  }, HOI_LAI_MS, !d.daThanhToan && !loiLink);

  if (loiLink) return <LoiLink status={loiLink} hotline={d.hotline} />;

  const chep = async (khoa, chu) => {
    const ok = await chepVao(chu);
    setDaChep(ok ? khoa : "");
    setThongBao(ok ? "Đã chép vào bộ nhớ." : "Không chép được, bạn bấm giữ để chép tay.");
    clearTimeout(hen.current);
    hen.current = setTimeout(() => setDaChep(""), 2500);
  };

  const paid = d.daThanhToan;
  const ck = d.chuyenKhoan;
  const thieu = !paid && d.daNhan > 0;
  const tel = telHref(d.hotline);
  const xe = dongPhu([d.xe?.ten, d.xe?.doi].filter(Boolean).join(" "), d.xe?.bienSo);

  return (
    <>
      <DauDon tieuDe={`Thanh toán đơn ${d.ma}`} phu={xe} />
      <h1 className="sr-only">Thanh toán đơn {d.ma}</h1>
      <p className="sr-only" aria-live="polite">{thongBao}</p>

      <section className={t.dauTrang}>
        <div className={`${t.trangThai} ${paid ? t.ttXong : ""}`}>
          <span className={t.cham} aria-hidden="true" />
          <div>
            <b>{paid ? "Đã thanh toán" : thieu ? "Đã nhận một phần" : "Đang chờ tiền về…"}</b>
            <span>
              {paid
                ? `Đơn ${d.ma} đã hoàn tất. Hoá đơn và bảo hành ở bên dưới.`
                : thieu
                  ? `Đã nhận ${tien(d.daNhan)}, còn ${tien(d.conPhaiTra)}. Mã QR bên dưới là số còn lại.`
                  : "Sửa xong rồi. Bạn chuyển khoản theo mã QR bên dưới nhé."}
            </span>
          </div>
        </div>
      </section>

      <section className={`${s.the} ${t.khoi}`} aria-labelledby="tieu-de-hang-muc">
        <div className={t.dauBang}>
          <h2 id="tieu-de-hang-muc">Hạng mục đã duyệt</h2>
          {d.xongLuc ? <span>Xong {gio(d.xongLuc)} {ngay(d.xongLuc)}</span> : null}
        </div>
        {d.hangMuc.map((h, i) => (
          <div key={`${h.ten}-${i}`} className={t.dongTien}>
            <span>{h.ten}</span>
            <span className={h.soTien < 0 ? t.am : undefined}>{h.hienThi || tien(h.soTien)}</span>
          </div>
        ))}
        <div className={s.ke} />
        <div className={s.tong}><b>{paid ? "Tổng đã thanh toán" : "Tổng cần thanh toán"}</b><b className={s.tongSo}>{d.tongHienThi || tien(d.tong)}</b></div>
        {d.tho?.ten ? <span className={s.ghiChu}>Thợ {d.tho.ten} đã sửa xong{d.xongLuc ? ` lúc ${gio(d.xongLuc)}` : ""}.</span> : null}
      </section>

      {!paid ? (
        <>
          {d.vietQR ? (
            <section className={`${s.the} ${t.khoi} ${t.qr}`} aria-labelledby="tieu-de-qr">
              <h2 id="tieu-de-qr">Quét mã VietQR để chuyển khoản</h2>
              <span className={t.qrGoiY}>Mở ứng dụng ngân hàng bất kỳ, chọn Quét QR. Số tiền và nội dung đã điền sẵn.</span>
              <div className={t.khungQr}>
                <img src={d.vietQR.anh} width="204" height="204" alt={`Mã VietQR chuyển ${tien(d.conPhaiTra)} cho đơn ${d.ma}`} />
              </div>
              <div className={t.napas}><b>VietQR</b><span aria-hidden="true">·</span><span>Napas 247 · tiền về trong vài giây</span></div>
              <a className={`${s.nutVien} ${t.nutLuu}`} href={d.vietQR.anh} download={`VietQR-${d.ma}.png`}><IconTai /> Lưu ảnh mã QR</a>
            </section>
          ) : null}

          {ck ? (
            <section className={`${s.the} ${t.khoi} ${t.tay}`} aria-labelledby="tieu-de-tay">
              <h2 id="tieu-de-tay">{d.vietQR ? "Hoặc chuyển khoản tay" : "Chuyển khoản"}</h2>
              <DongChep nhan="Ngân hàng" giaTri={ck.nganHang} daChep={daChep === "nh"} onChep={(c) => chep("nh", c)} />
              <DongChep nhan="Số tài khoản" giaTri={ck.soTaiKhoan} chep={ck.soTaiKhoan.replace(/\s/g, "")} lop={t.to} daChep={daChep === "stk"} onChep={(c) => chep("stk", c)} />
              <DongChep nhan="Chủ tài khoản" giaTri={ck.chuTaiKhoan} daChep={daChep === "chu"} onChep={(c) => chep("chu", c)} />
              <DongChep nhan="Số tiền" giaTri={ck.soTienHienThi || tien(ck.soTien)} chep={String(ck.soTien)} lop={t.tien} daChep={daChep === "tien"} onChep={(c) => chep("tien", c)} />
              <DongChep nhan="Nội dung chuyển khoản" giaTri={ck.noiDung} lop={t.to} daChep={daChep === "nd"} onChep={(c) => chep("nd", c)} />
              <div className={t.nhacNoiDung}>Ghi đúng nội dung <b>{ck.noiDung}</b> để hệ thống tự nhận tiền. Không cần chụp màn hình gửi thợ.</div>
            </section>
          ) : (
            <section className={`${s.the} ${t.khoi}`}>
              <h2 className={s.theTieuDe}>Thanh toán với tổng đài</h2>
              <span className={s.ghiChu}>Tài khoản nhận chuyển khoản đang được cập nhật. Bạn gọi tổng đài để thanh toán hoặc trả tiền mặt cho thợ.</span>
            </section>
          )}

          {ck ? (
            <section className={`${s.the} ${t.khoi} ${t.cho}`} role="status">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={t.xoay}>
                <path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 3 21 9 15 9" />
              </svg>
              <div>
                <b>Đang chờ tiền về…</b>
                <span>Trang tự cập nhật ngay khi tiền vào tài khoản. Bạn cứ để mở trang này.</span>
              </div>
            </section>
          ) : null}

          {tel ? (
            <div className={t.vungNut}>
              <a className={`${s.nutVien} ${t.nutGoiLai}`} href={tel}><Icon name="phone" size={18} /> Chuyển rồi mà chưa thấy? Gọi {d.hotline}</a>
            </div>
          ) : null}
        </>
      ) : (
        <>
          {d.bienNhan ? (
            <section className={`${s.the} ${t.khoi}`} aria-labelledby="tieu-de-bien-nhan">
              <h2 id="tieu-de-bien-nhan">Biên nhận</h2>
              <div className={s.hang}><span>Số tiền đã nhận</span><b className={t.xanh}>{tien(d.bienNhan.soTien)}</b></div>
              {d.bienNhan.luc ? <div className={s.hang}><span>Thời điểm</span><b>{ngay(d.bienNhan.luc)} {gio(d.bienNhan.luc)}</b></div> : null}
              <div className={s.hang}><span>Hình thức</span><b>{d.bienNhan.hinhThuc}</b></div>
              {d.bienNhan.maGiaoDich ? <div className={s.hang}><span>Mã giao dịch</span><b>{d.bienNhan.maGiaoDich}</b></div> : null}
            </section>
          ) : null}

          <HoaDon token={token} hoaDon={d.hoaDon} sdt={d.sdtNhanHoaDon} hotline={d.hotline} />

          {d.baoHanh ? (
            <section className={`${t.khoi} ${t.baoHanh}`} aria-labelledby="tieu-de-bao-hanh">
              <div className={t.dauKhoi}>
                <span className={t.oIconXanh} aria-hidden="true"><Icon name="shield" size={22} /></span>
                <div className={t.dauChu}>
                  <h2 id="tieu-de-bao-hanh">Phiếu bảo hành điện tử {d.baoHanh.ma}</h2>
                  <span>Gắn với biển số {d.baoHanh.bienSo}, không cần giữ giấy.</span>
                </div>
              </div>
              <ul className={t.dsBaoHanh}>
                {d.baoHanh.hangMuc.map((h, i) => (
                  <li key={`${h.ten}-${i}`}><span>{h.ten}</span><b>{h.hetHan ? "Hết hạn" : `đến ${ngay(h.denNgay)}`}</b></li>
                ))}
              </ul>
              <span className={t.ghiChuXanh}>
                {camKet?.baoHanhPhuTungThang && camKet?.baoHanhCongThang
                  ? `Bảo hành ${camKet.baoHanhPhuTungThang} tháng phụ tùng, ${camKet.baoHanhCongThang} tháng công. `
                  : ""}
                Có lỗi, nhắn Zalo hoặc gọi {d.hotline || "tổng đài"}, thợ đến kiểm tra miễn phí.
              </span>
            </section>
          ) : null}

          <div className={t.vungNut}>
            <Link className="nut nut-chinh nut-day" href={`/don/${token}/`}>Xong. Cảm ơn bạn đã tin ThợTới</Link>
          </div>
        </>
      )}

      <div className={s.dayXuong} />
      <footer className={s.chan}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        <span>
          Link này chỉ dành cho bạn và hết hạn 24 giờ sau khi đơn xong
          ({d.hetHanLinkLuc ? `${gio(d.hetHanLinkLuc)} ngày ${ngay(d.hetHanLinkLuc)}` : "24 giờ sau khi thanh toán"}).
          Hoá đơn và bảo hành vẫn <Link href="/tra-cuu-xe/">tra lại được bằng biển số xe</Link>.
        </span>
      </footer>
    </>
  );
}
