"use client";
// Chọn gói hội viên, bảng so sánh (đổi cột nổi bật theo gói chọn) và form đăng ký mua gói.
// Dữ liệu từ layTrangHoiVien() (lib/hoi-vien.ts); gửi POST /api/hoi-vien/dang-ky, link thanh toán VietQR gửi qua Zalo.
import { useEffect, useState } from "react";
import { TruongNhap, oNhap, ODongY, OBay } from "../chung/Form";
import Icon from "../Icon";
import { ghiSuKien, layMaTuLink, layNguon } from "@/lib/su-kien-client";
import { kiemTraDangKyHoiVien } from "@/lib/p2-dau-vao.mjs";
import { dungForm, guiJson } from "./dungForm";
import s from "./GoiHoiVien.module.css";

export default function GoiHoiVien({ goi, bangSoSanh, thoiHanThang = 12, hotline, chinhSach }) {
  const macDinh = goi.find((g) => /nhiều người chọn/i.test(g.nhan || ""))?.slug || goi[goi.length - 1]?.slug;
  const [chon, datChon] = useState(macDinh);
  const [ketQua, datKetQua] = useState(null);
  const f = dungForm({ hoTen: "", sdt: "", bienSo: "", maGioiThieu: "", dongY: false, website: "" }, (v) => kiemTraDangKyHoiVien({ ...v, goi: chon }));
  const { giaTri: v, doi, roi, loi } = f;
  const g = goi.find((x) => x.slug === chon) || goi[0];
  const iChon = goi.indexOf(g);

  useEffect(() => {
    const ma = layMaTuLink();
    if (ma) f.datGiaTri((cu) => (cu.maGioiThieu ? cu : { ...cu, maGioiThieu: ma }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function dangKy(e) {
    e.preventDefault();
    const kq = await f.gui((gt) => guiJson("/api/hoi-vien/dang-ky", { ...gt, goi: chon, nguon: layNguon() }));
    if (kq) {
      ghiSuKien("guiForm");
      datKetQua(kq);
    }
  }

  // Phím mũi tên trong nhóm radio (role="radio" trên nút).
  const phim = (e, i) => {
    const buoc = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!buoc) return;
    e.preventDefault();
    const k = goi[(i + buoc + goi.length) % goi.length];
    datChon(k.slug);
    document.getElementById(`goi-${k.slug}`)?.focus();
  };

  return (
    <>
      <div role="radiogroup" aria-label="Gói hội viên" className={s.dsGoi}>
        {goi.map((x, i) => {
          const on = x.slug === chon;
          return (
            <button
              key={x.slug} id={`goi-${x.slug}`} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1}
              onClick={() => datChon(x.slug)} onKeyDown={(e) => phim(e, i)} className={`${s.goi} ${on ? s.goiChon : ""}`}
            >
              {x.nhan ? <span className={s.nhanGoi}>{x.nhan}</span> : null}
              <b className={s.tenGoi}>{x.ten}</b>
              <b className={s.gia}>{x.giaNamHienThi}</b>
              <span className={s.giaThang}>mỗi năm · khoảng {x.giaThangHienThi}/tháng</span>
            </button>
          );
        })}
      </div>

      {bangSoSanh.length > 0 && (
        <div className={s.bang} role="table" aria-label="So sánh quyền lợi các gói">
          <div className={`${s.hang} ${s.dauBang}`} role="row" style={{ "--so-cot": goi.length }}>
            <span role="columnheader">Quyền lợi</span>
            {goi.map((x, i) => <span role="columnheader" key={x.slug} className={i === iChon ? s.cotChon : ""}>{x.quyenLoi?.ten || x.ten}</span>)}
          </div>
          {bangSoSanh.map((r) => (
            <div className={s.hang} role="row" key={r.ten} style={{ "--so-cot": goi.length }}>
              <span role="rowheader">{r.ten}</span>
              {r.goi.map((o, i) => (
                <span role="cell" key={i} className={`${o.co ? s.co : s.khong} ${i === iChon ? s.oChon : ""}`}>{o.chu}</span>
              ))}
            </div>
          ))}
        </div>
      )}

      {g?.loiIch ? (
        <p className={s.loiIch}><Icon name="check" size={18} /> <span>{g.loiIch}</span></p>
      ) : null}

      <section className={`the ${s.dangKy}`} aria-labelledby="tieu-de-dang-ky" id="dang-ky">
        {ketQua ? (
          <div className={s.xong} role="status">
            <div className={s.xongDau}>
              <span className={s.dauTich} aria-hidden="true"><Icon name="check" size={22} /></span>
              <h2 id="tieu-de-dang-ky">Đã nhận đăng ký {ketQua.goi?.ten}</h2>
            </div>
            <p>
              Mã đăng ký <b>{ketQua.ma}</b> cho xe <b>{ketQua.bienSo}</b>. Link thanh toán VietQR {ketQua.goi?.soTienHienThi} vừa gửi tới{" "}
              {ketQua.daGuiQua === "sms" ? "tin nhắn" : "Zalo"} số {ketQua.sdtChe}.
              {hotline ? <> Có gì thắc mắc, gọi {hotline}.</> : null}
            </p>
            {ketQua.noiTiepTu ? (
              <p className="bao bao-vang">Xe này đang có gói còn hạn. Gói mới bắt đầu khi gói cũ hết hạn ({new Date(ketQua.noiTiepTu).toLocaleDateString("vi-VN")}).</p>
            ) : null}
            {ketQua.maGioiThieu && !ketQua.maGioiThieu.apDung && ketQua.maGioiThieu.lyDo ? (
              <p className="bao bao-vang">Mã giới thiệu chưa áp dụng: {ketQua.maGioiThieu.lyDo}</p>
            ) : null}
            {ketQua.linkThanhToan ? (
              <a className="nut nut-chinh nut-day" href={new URL(ketQua.linkThanhToan, location.origin).pathname}>Thanh toán ngay</a>
            ) : null}
          </div>
        ) : (
          <form onSubmit={dangKy} noValidate className={s.form}>
            <div>
              <h2 id="tieu-de-dang-ky">Đăng ký {g?.ten}</h2>
              <p className="phu">Để lại số, cố vấn gửi link thanh toán VietQR qua Zalo. Thanh toán xong gói có hiệu lực ngay.</p>
            </div>
            <TruongNhap id="hoTen" nhan="Họ tên" loi={loi.hoTen}>
              <input {...oNhap("hoTen", loi.hoTen)} autoComplete="name" value={v.hoTen} onChange={(e) => doi("hoTen", e.target.value)} onBlur={() => roi("hoTen")} />
            </TruongNhap>
            <div className={s.hai}>
              <TruongNhap id="sdt" nhan="Số điện thoại" loi={loi.sdt}>
                <input {...oNhap("sdt", loi.sdt)} type="tel" inputMode="tel" autoComplete="tel" placeholder="09xx xxx xxx" value={v.sdt} onChange={(e) => doi("sdt", e.target.value)} onBlur={() => roi("sdt")} />
              </TruongNhap>
              <TruongNhap id="bienSo" nhan="Biển số xe" loi={loi.bienSo}>
                <input {...oNhap("bienSo", loi.bienSo)} className={`${oNhap("bienSo", loi.bienSo).className} ${s.bienSo}`} autoCapitalize="characters" placeholder="30A-123.45" value={v.bienSo} onChange={(e) => doi("bienSo", e.target.value)} onBlur={() => roi("bienSo")} />
              </TruongNhap>
            </div>
            <TruongNhap id="maGioiThieu" nhan="Mã giới thiệu (nếu có)" loi={loi.maGioiThieu}>
              <input {...oNhap("maGioiThieu", loi.maGioiThieu)} autoCapitalize="characters" placeholder="VD: HUONG7315" value={v.maGioiThieu} onChange={(e) => doi("maGioiThieu", e.target.value.toUpperCase())} />
            </TruongNhap>
            <ODongY
              checked={v.dongY} onChange={(e) => doi("dongY", e.target.checked)} loi={loi.dongY}
              noiDung="Tôi đồng ý cho xử lý dữ liệu cá nhân để đăng ký gói" linkChinhSach={chinhSach}
            />
            <OBay value={v.website} onChange={(e) => doi("website", e.target.value)} />
            {f.loiChung ? <p className="bao bao-loi" role="alert">{f.loiChung}</p> : null}
            <button type="submit" className="nut nut-chinh nut-lon nut-day" disabled={f.dangGui}>
              {f.dangGui ? "Đang gửi…" : `Đăng ký mua gói · ${g?.giaNamHienThi}`}
            </button>
            <p className={`phu nho ${s.giua}`}>Chưa trừ tiền khi bấm. Gói dùng {thoiHanThang} tháng kể từ ngày thanh toán.</p>
          </form>
        )}
      </section>
    </>
  );
}
