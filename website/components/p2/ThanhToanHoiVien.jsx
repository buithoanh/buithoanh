"use client";
// Màn thanh toán gói hội viên (link riêng /hoi-vien/thanh-toan/<token>/), mượn bố cục màn ThanhToan:
// trạng thái, tóm tắt gói, VietQR, chuyển khoản tay (sao chép từng dòng), tự hỏi lại mỗi 5 giây đến khi tiền về
// (GET /api/hoi-vien/thanh-toan/:token, xem docs/api.md mục 8) rồi chuyển sang phần "gói đã có hiệu lực".
import { useEffect, useState } from "react";
import Icon from "../Icon";
import NutSaoChep from "./NutSaoChep";
import s from "./ThanhToanHoiVien.module.css";

const HOI_LAI_MS = 5000;
const ngay = (d) => (d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }) : "");
const luot = (n, ten) => (n === null || n === undefined ? `${ten}: không giới hạn` : `${ten}: còn ${n} lần`);

export default function ThanhToanHoiVien({ token, duLieuDau, telHref }) {
  const [d, datD] = useState(duLieuDau);
  const [loiMang, datLoiMang] = useState(false);
  const cho = d.trangThai === "choThanhToan";

  useEffect(() => {
    if (!cho) return;
    let huy = false;
    let hen;
    const hoi = async () => {
      if (document.visibilityState === "visible") {
        try {
          const r = await fetch(`/api/hoi-vien/thanh-toan/${encodeURIComponent(token)}`, { cache: "no-store" });
          if (r.ok) {
            const moi = await r.json();
            if (!huy) { datD(moi); datLoiMang(false); }
          } else if (r.status >= 500 && !huy) datLoiMang(true);
        } catch {
          if (!huy) datLoiMang(true);
        }
      }
      if (!huy) hen = setTimeout(hoi, HOI_LAI_MS);
    };
    hen = setTimeout(hoi, HOI_LAI_MS);
    return () => { huy = true; clearTimeout(hen); };
  }, [cho, token]);

  const ck = d.chuyenKhoan || {};
  const daTra = d.trangThai === "hieuLuc";
  const trangThai = daTra
    ? { lop: s.ttXong, tieuDe: "Đã thanh toán", ghiChu: `${d.goi} cho xe ${d.bienSo} đã có hiệu lực.` }
    : cho
      ? { lop: s.ttCho, tieuDe: "Đang chờ tiền về…", ghiChu: d.daNhan > 0 ? `Đã nhận ${d.daNhan.toLocaleString("vi-VN")}đ, còn thiếu ${d.conPhaiTra.toLocaleString("vi-VN")}đ.` : "Bạn chuyển khoản theo mã QR bên dưới, gói có hiệu lực ngay khi tiền về." }
      : d.trangThai === "hetHan"
        ? { lop: s.ttXam, tieuDe: "Gói đã hết hạn", ghiChu: "Đăng ký gói mới ở trang Hội viên để tiếp tục nhận quyền lợi." }
        : { lop: s.ttXam, tieuDe: "Đăng ký đã huỷ", ghiChu: "Link này không còn dùng để thanh toán." };

  const dong = [
    { k: "nganHang", nhan: "Ngân hàng", giaTri: ck.nganHang },
    { k: "stk", nhan: "Số tài khoản", giaTri: ck.soTaiKhoan, to: true },
    { k: "chu", nhan: "Chủ tài khoản", giaTri: ck.chuTaiKhoan },
    { k: "tien", nhan: "Số tiền", giaTri: ck.soTien, hien: ck.soTienHienThi, tien: true },
    { k: "nd", nhan: "Nội dung chuyển khoản", giaTri: ck.noiDung, to: true },
  ].filter((x) => x.giaTri !== undefined && x.giaTri !== null && x.giaTri !== "");

  return (
    <>
      <section className={s.khoi}>
        <div className={`${s.trangThai} ${trangThai.lop}`} role="status" aria-live="polite">
          <span className={s.cham} aria-hidden="true" />
          <div>
            <b>{trangThai.tieuDe}</b>
            <span>{trangThai.ghiChu}</span>
          </div>
        </div>
      </section>

      <section className={`the ${s.the}`} aria-labelledby="tom-tat">
        <h2 id="tom-tat" className={s.h2}>Gói đã đăng ký</h2>
        <div className={s.dongTien}><span>{d.goi} · 12 tháng</span><b>{d.soTienHienThi}</b></div>
        <div className={s.dongTien}><span>Biển số</span><b>{d.bienSo}</b></div>
        {d.hoTen ? <div className={s.dongTien}><span>Chủ gói</span><b>{d.hoTen} · {d.sdtChe}</b></div> : null}
        <div className={s.ke} />
        <div className={s.tong}><b>{daTra ? "Đã thanh toán" : "Tổng cần thanh toán"}</b><b className={s.soTong}>{daTra ? d.soTienHienThi : (ck.soTienHienThi || d.soTienHienThi)}</b></div>
      </section>

      {cho ? (
        <>
          {d.vietQR?.anh ? (
            <section className={`the ${s.the} ${s.qr}`} aria-labelledby="tieu-de-qr">
              <h2 id="tieu-de-qr" className={s.h2}>Quét mã VietQR để chuyển khoản</h2>
              <p className={s.phuGiua}>Mở ứng dụng ngân hàng bất kỳ, chọn Quét QR. Số tiền và nội dung đã điền sẵn.</p>
              <div className={s.khungQr}>
                <img src={d.vietQR.anh} alt={`Mã VietQR chuyển ${ck.soTienHienThi} tới ${ck.nganHang || "tài khoản công ty"}, nội dung ${ck.noiDung}`} width={204} height={204} />
              </div>
              <p className={s.napas}><b>VietQR</b><span aria-hidden="true">·</span><span>Napas 247 · tiền về trong vài giây</span></p>
              <a className={`nut nut-trang ${s.luuQr}`} href={d.vietQR.anh} download={`VietQR-${d.ma}.png`}>
                <Icon name="tai-xuong" size={18} /> Lưu ảnh mã QR
              </a>
            </section>
          ) : null}

          <section className={`the ${s.the} ${s.tay}`} aria-labelledby="tieu-de-tay">
            <h2 id="tieu-de-tay" className={s.h2}>{d.vietQR?.anh ? "Hoặc chuyển khoản tay" : "Chuyển khoản"}</h2>
            {dong.map((x) => (
              <div key={x.k} className={s.dongCk}>
                <div className={s.dongChu}>
                  <span>{x.nhan}</span>
                  <b className={`${x.to ? s.to : ""} ${x.tien ? s.tien : ""}`}>{x.hien || x.giaTri}</b>
                </div>
                <NutSaoChep giaTri={x.giaTri} moTa={x.nhan.toLowerCase()} />
              </div>
            ))}
            {ck.noiDung ? (
              <p className={s.nhacNd}>Ghi đúng nội dung <b>{ck.noiDung}</b> để hệ thống tự nhận tiền. Không cần chụp màn hình gửi lại.</p>
            ) : null}
          </section>

          <section className={`the ${s.the} ${s.cho}`}>
            <span className={s.quay} aria-hidden="true" />
            <div>
              <b>Đang chờ tiền về…</b>
              <span>Trang tự cập nhật ngay khi tiền vào tài khoản. Bạn cứ để mở trang này.</span>
              {loiMang ? <span className={s.loi}>Đang mất kết nối, trang sẽ tự thử lại.</span> : null}
            </div>
          </section>

          {telHref ? (
            <div className={s.khoi}>
              <a className={`nut nut-trang nut-day ${s.goi}`} href={telHref}>
                <Icon name="phone" size={18} /> Chuyển rồi mà chưa thấy? Gọi {d.hotline}
              </a>
            </div>
          ) : null}
        </>
      ) : null}

      {daTra && d.quyenLoi ? (
        <section className={`${s.the} ${s.hieuLuc}`} aria-labelledby="tieu-de-hl">
          <div className={s.hlDau}>
            <span className={s.oIcon} aria-hidden="true"><Icon name="shield" size={22} /></span>
            <div>
              <h2 id="tieu-de-hl">Hội viên {d.quyenLoi.goi?.replace(/^Gói\s+/i, "")} · {d.ma}</h2>
              <span>Gắn với biển số {d.bienSo}, không cần giữ giấy.</span>
            </div>
          </div>
          <div className={s.dongHl}><span>Hiệu lực</span><b>{ngay(d.quyenLoi.batDau)} – {ngay(d.quyenLoi.hetHan)}</b></div>
          <div className={s.dongHl}><span>{luot(d.quyenLoi.conLai?.diLai, "Miễn phí đi lại")}</span></div>
          <div className={s.dongHl}><span>{luot(d.quyenLoi.conLai?.kichNo, "Kích nổ ắc quy")}</span></div>
          {d.quyenLoi.conLai?.vaLop !== 0 ? <div className={s.dongHl}><span>{luot(d.quyenLoi.conLai?.vaLop, "Vá lốp")}</span></div> : null}
          {d.quyenLoi.giamCongPhanTram ? <div className={s.dongHl}><span>Giảm {d.quyenLoi.giamCongPhanTram}% tiền công mỗi đơn</span></div> : null}
          {d.quyenLoi.uuTienGoiGap ? <div className={s.dongHl}><span>Ưu tiên xếp thợ khi gọi gấp</span></div> : null}
          <p className={s.hlGhiChu}>Quyền lợi tự áp khi thợ sửa xong đơn của xe này. Tra lại hạn và lượt còn lại bằng biển số ở trang Tra cứu lịch sử xe.</p>
          <a className="nut nut-chinh nut-day" href="/dat-lich/">Đặt thợ ngay</a>
        </section>
      ) : null}
    </>
  );
}
