"use client";
// Màn TheoDoi (/don/[token]/): trạng thái đơn, thợ, giờ đến, các bước, việc khách cần làm.
// Server render lần đầu (banDau); sau đó hỏi lại GET /api/don-hang/theo-doi/:token mỗi 30 giây khi tab đang mở.
import { useEffect, useState } from "react";
import Link from "next/link";
import DauDon from "@/components/chung/DauDon";
import Icon from "@/components/Icon";
import TheTho from "./TheTho";
import LoiLink from "./LoiLink";
import { goiApi, useHoiLai } from "./hoi-lai";
import { dongPhu, gio, ngay, ngayNgan, telHref, tien } from "./dinh-dang";
import s from "./TheoDoiDon.module.css";

const HOI_LAI_MS = 30000;
const KET_THUC = new Set(["hoanThanh", "huy"]);

/** Dòng chữ lớn đầu tấm thông tin theo trạng thái. */
function tomTat(d, bayGio) {
  const eta = d.viTri?.etaTu != null && d.viTri?.etaDen != null ? `${d.viTri.etaTu}–${d.viTri.etaDen} phút` : null;
  const link = (trang) => `/don/${d.token}/${trang}/`;
  switch (d.trangThai) {
    case "thoDangDen": {
      const phut = bayGio && d.thoDuKienDenLuc ? Math.round((new Date(d.thoDuKienDenLuc).getTime() - bayGio) / 60000) : null;
      return {
        nhan: "Thợ đang đến · dự kiến", chinh: gio(d.thoDuKienDenLuc) || eta || "Sắp tới",
        chip: phut == null ? null : phut > 0 ? `còn ${phut} phút` : "sắp tới nơi",
      };
    }
    case "daXepTho":
      return { nhan: "Đã xếp thợ · dự kiến đến", chinh: gio(d.thoDuKienDenLuc) || d.khungGio || eta || "Sắp xếp giờ" };
    case "choDuyetBaoGia":
      return {
        nhan: "Thợ đã kiểm tra xe", chinh: "Chờ bạn duyệt báo giá", nhacThem: "Thợ chỉ làm sau khi bạn đồng ý. Bạn bỏ bớt được hạng mục chưa cần.",
        cta: [{ href: link("bao-gia"), ten: "Xem và duyệt báo giá", lop: "nut nut-chinh nut-day" }],
      };
    case "dangSua":
      return {
        nhan: "Bạn đã duyệt báo giá", chinh: "Thợ đang sửa",
        cta: [{ href: link("bao-gia"), ten: "Xem báo giá đã duyệt", lop: "nut nut-trang nut-day" }],
      };
    case "choThanhToan":
      return {
        nhan: "Đã sửa xong · cần thanh toán", chinh: d.thanhToan?.soTien ? tien(d.thanhToan.soTien) : "Chờ thanh toán",
        nhacThem: "Chuyển khoản VietQR, tiền về là trang tự cập nhật.",
        cta: [{ href: link("thanh-toan"), ten: "Thanh toán VietQR", lop: "nut nut-chinh nut-day" }],
      };
    case "hoanThanh":
      return {
        nhan: "Đơn đã xong", chinh: "Hoàn thành", chip: "Đã thanh toán", chipXanh: true,
        cta: [
          { href: link("thanh-toan"), ten: "Xem biên nhận, hoá đơn, bảo hành", lop: "nut nut-toi nut-day" },
          ...(d.linkDanhGia ? [{ href: d.linkDanhGia, ten: "Đánh giá lần sửa này", lop: "nut nut-trang nut-day" }] : []),
        ],
      };
    case "huy":
      return {
        nhan: "Đơn đã huỷ", chinh: "Đã huỷ", nhacThem: "Cần thợ lần khác? Đặt lịch mới hoặc gọi tổng đài.",
        cta: [{ href: "/dat-lich/", ten: "Đặt lịch mới", lop: "nut nut-trang nut-day" }],
      };
    default: // daNhan
      return d.loai === "khanCap"
        ? { nhan: "Đã nhận đơn gọi gấp · thợ tới trong", chinh: eta || "Đang tìm thợ", nhacThem: "Điều phối đang tìm thợ gần bạn nhất." }
        : { nhan: "Đã nhận đơn · giờ hẹn", chinh: d.khungGio || "Chờ xác nhận", nhacThem: "Cố vấn sẽ gọi lại để chốt giờ và xếp thợ." };
  }
}

/** Giờ của một bước; khác ngày tạo đơn thì thêm ngày. */
function lucBuoc(b, taoLuc) {
  if (!b.luc) return b.tinhTrang === "now" ? "bây giờ" : "";
  return ngay(b.luc) === ngay(taoLuc) ? gio(b.luc) : `${gio(b.luc)} ${ngayNgan(b.luc)}`;
}

function BanDo({ viTriTho }) {
  const ban = `https://www.google.com/maps/search/?api=1&query=${viTriTho.lat},${viTriTho.lng}`;
  return (
    <div className={s.banDo}>
      {/* Hình minh hoạ đường đi; vị trí thật mở bằng nút "Xem vị trí thợ" */}
      <svg className={s.hinh} viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <path className={s.duongPho} d="M0 90 L390 70 M0 210 L390 190 M110 0 L140 300 M280 0 L250 300 M0 150 L390 140" />
        <path className={s.duongDi} d="M60 250 L130 216 L140 145 L262 135 L300 92" />
        <circle className={s.quang} cx="300" cy="92" r="22" />
        <path className={s.ghim} d="M300 64c-9 0-16 7-16 16 0 12 16 26 16 26s16-14 16-26c0-9-7-16-16-16z" />
        <circle className={s.tamGhim} cx="300" cy="80" r="5" />
        <rect className={s.xeTho} x="114" y="200" width="36" height="24" rx="6" />
        <path className={s.denXe} d="M120 212 h24" />
      </svg>
      <span className={s.chipBanDo}>
        Cập nhật vị trí mỗi 30 giây{viTriTho.luc ? ` · lúc ${gio(viTriTho.luc)}` : ""}
      </span>
      <a className={s.moBanDo} href={ban} target="_blank" rel="noopener">
        <Icon name="pin" size={18} /> Xem vị trí thợ
      </a>
    </div>
  );
}

export default function TheoDoiDon({ token, banDau, zalo }) {
  const [d, setD] = useState(banDau);
  const [loiLink, setLoiLink] = useState(null);
  const [bayGio, setBayGio] = useState(null);
  const [thongBao, setThongBao] = useState("");

  // Đồng hồ cho "còn N phút" (chỉ chạy trên trình duyệt để không lệch khi hydrate)
  useEffect(() => {
    setBayGio(Date.now());
    const t = setInterval(() => setBayGio(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useHoiLai(async () => {
    const r = await goiApi(`/api/don-hang/theo-doi/${token}`);
    if (r.ok) {
      if (d.trangThai !== r.json.trangThai) setThongBao(`Trạng thái đơn: ${r.json.nhanTrangThai}`);
      setD(r.json);
      setBayGio(Date.now());
    } else if (r.status === 404 || r.status === 410) setLoiLink(r.status);
  }, HOI_LAI_MS, !KET_THUC.has(d.trangThai) && !loiLink);

  if (loiLink) return <LoiLink status={loiLink} hotline={d.hotline} />;

  const tt = tomTat({ ...d, token }, bayGio);
  const coBanDo = d.trangThai === "thoDangDen" && d.viTriTho;
  const tenViec = d.dichVu?.length ? d.dichVu.map((x) => x.ten).join(", ") : d.tenSuCo || d.suCo;
  const xe = dongPhu([d.xe?.ten, d.xe?.doi].filter(Boolean).join(" "), d.xe?.bienSo);
  const tel = telHref(d.hotline);

  return (
    <>
      <DauDon tieuDe={`Đơn ${d.ma}`} phu={dongPhu(tenViec, d.xe?.ten, d.xe?.bienSo)} />
      <h1 className="sr-only">Theo dõi đơn {d.ma}: {d.nhanTrangThai}</h1>
      <p className="sr-only" aria-live="polite">{thongBao}</p>
      {coBanDo ? <BanDo viTriTho={d.viTriTho} /> : null}

      <section className={`${s.tam} ${coBanDo ? s.tamNoi : ""}`} aria-label="Trạng thái đơn">
        {coBanDo ? <span className={s.tayCam} aria-hidden="true" /> : null}
        <div className={s.dau}>
          <div className={s.dauTrai}>
            <span>{tt.nhan}</span>
            <b className={`${s.lon} ${String(tt.chinh).length > 8 ? s.lonVua : ""}`}>{tt.chinh}</b>
          </div>
          {tt.chip ? <span className={`${s.chip} ${tt.chipXanh ? s.chipXanh : ""}`}>{tt.chip}</span> : null}
        </div>
        {tt.nhacThem ? <p className={s.loiNhac}>{tt.nhacThem}</p> : null}
        {tt.cta?.length ? (
          <div className={s.cta}>
            {tt.cta.map((c) => <Link key={c.href} className={c.lop} href={c.href}>{c.ten}</Link>)}
          </div>
        ) : null}

        <TheTho tho={d.tho} lon />

        <div className={s.haiNut}>
          <a className={s.goi} href={tel} aria-disabled={tel ? undefined : "true"}>
            <Icon name="phone" size={18} /> {tel ? "Gọi tổng đài" : "Hotline sắp có"}
          </a>
          <a className={s.nhanTin} href={zalo || undefined} target="_blank" rel="noopener" aria-disabled={zalo ? undefined : "true"}>
            Nhắn tổng đài
          </a>
        </div>

        <ol className={s.buoc} aria-label="Các bước của đơn">
          {d.cacBuoc.map((b) => (
            <li key={b.trangThai} aria-current={b.tinhTrang === "now" ? "step" : undefined}>
              <div className={s.cot} aria-hidden="true">
                <span className={`${s.cham} ${b.tinhTrang === "done" ? s.chamXong : b.tinhTrang === "now" ? s.chamNay : ""}`} />
                <span className={`${s.duong} ${b.tinhTrang === "done" ? s.duongXong : ""}`} />
              </div>
              <div className={s.dong}>
                <span className={b.tinhTrang === "now" ? s.chuNay : b.tinhTrang === "todo" ? s.chuChua : undefined}>
                  {b.nhan}
                  {b.tinhTrang === "done" ? <span className="sr-only"> (xong)</span> : b.tinhTrang === "now" ? <span className="sr-only"> (đang ở bước này)</span> : null}
                </span>
                <span className={s.luc}>{lucBuoc(b, d.taoLuc)}</span>
              </div>
            </li>
          ))}
        </ol>

        <dl className={s.thongTin}>
          {tenViec ? <><dt>{d.dichVu?.length ? "Dịch vụ" : "Sự cố"}</dt><dd>{tenViec}</dd></> : null}
          {xe ? <><dt>Xe</dt><dd>{xe}</dd></> : null}
          {d.viTri?.diaChi ? <><dt>Địa chỉ</dt><dd>{d.viTri.diaChi}</dd></> : null}
          {d.khungGio ? <><dt>Giờ hẹn</dt><dd>{d.khungGio}</dd></> : null}
          {d.giaSoBo?.hienThi ? <><dt>Giá sơ bộ</dt><dd>{d.giaSoBo.hienThi}</dd></> : null}
          {d.khach?.sdt ? <><dt>Số điện thoại</dt><dd>{d.khach.sdt}</dd></> : null}
        </dl>

        <p className={s.ghiChu}>
          Link riêng cho đơn của bạn, hết hạn 24 giờ sau khi đơn hoàn thành
          {d.hetHanLinkLuc ? ` (${gio(d.hetHanLinkLuc)} ngày ${ngay(d.hetHanLinkLuc)})` : ""}.
          {!KET_THUC.has(d.trangThai) ? " Trang tự cập nhật khi bạn để mở." : ""}
        </p>
      </section>
    </>
  );
}
