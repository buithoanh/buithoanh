// Kết quả kiểm tra vùng phục vụ: trong vùng (xanh, địa chỉ + thời gian tới) hoặc ngoài vùng
// (câu thông báo từ server + mời gọi tư vấn). khanCap: kiểu đỏ của màn gọi gấp, thêm nút đặt kéo xe.
import Icon from "../Icon";
import { telHref } from "./goi-api";
import s from "./ThongBaoVung.module.css";

const boCauDau = (t = "") => t.replace(/^[^.]*ngoài vùng phục vụ\.\s*/i, "");

export default function ThongBaoVung({ ketQua, khanCap = false, hotline, linkKeoXe }) {
  if (!ketQua) return null;
  const diaChi = ketQua.viTri?.diaChi;
  if (ketQua.trongVung) {
    const eta = ketQua.eta;
    return (
      <div className={s.trong} role="status">
        <Icon name="check" size={20} className={s.icon} />
        <span>
          <b>Trong vùng phục vụ.</b>{diaChi ? ` ${diaChi}.` : ""}
          {eta ? ` Thợ tới dự kiến ${eta.tu}–${eta.den} phút.` : ""}
        </span>
      </div>
    );
  }
  const loiNhan = boCauDau(ketQua.thongBao) || ketQua.thongBao;
  const tel = telHref(hotline);
  return (
    <div className={khanCap ? s.ngoaiKhan : s.ngoai} role="alert">
      <b className={khanCap ? s.tieuDeKhan : s.tieuDe}>{khanCap ? "Vị trí" : "Địa chỉ"} này ngoài vùng phục vụ</b>
      <span>{diaChi ? `${diaChi}. ` : ""}{loiNhan}</span>
      {khanCap ? (
        <div className={s.haiNut}>
          <a className="nut nut-chinh" href={tel}>Gọi tư vấn</a>
          {linkKeoXe ? <a className="nut nut-trang" href={linkKeoXe}>Đặt kéo xe</a> : null}
        </div>
      ) : tel ? (
        <a className="link-nhan" href={tel}>Gọi tư vấn {hotline} →</a>
      ) : null}
    </div>
  );
}
