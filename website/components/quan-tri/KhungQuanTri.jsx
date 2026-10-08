// Khung chung các màn quản trị: thanh trên (thương hiệu, xem website, người dùng, đăng xuất), menu trái theo vai trò,
// hộp "Quyền của bạn" và vùng nội dung. Mục chưa có màn riêng trỏ sang trang tương ứng trong /admin.
import site from "@/site.config.mjs";
import IconQt from "./IconQt";
import NutDangXuat from "./NutDangXuat";
import { MO_TA_QUYEN, TEN_VAI_TRO, duoc } from "@/lib/quan-tri/phien";
import s from "./KhungQuanTri.module.css";

const chuCaiDau = (ten) =>
  String(ten || "?").trim().split(/\s+/).filter(Boolean).slice(-2).map((t) => t[0]).join("").toUpperCase();

/**
 * @param {{ user: any, hienTai: string, soChoDuyet?: number, children: any, phuTrai?: any }} p
 * hienTai: "bai-viet" | "bang-gia" | "vung" | "ma-khuyen-mai" | "so-lieu"
 */
export default function KhungQuanTri({ user, hienTai, soChoDuyet = 0, children, phuTrai }) {
  const ten = user.ten || user.email;
  const muc = [
    { k: "tong-quan", nhan: "Tổng quan", href: "/quan-tri/", icon: "tong-quan", hien: true },
    { k: "bai-viet", nhan: "Bài viết & trang", href: "/quan-tri/bai-viet/", icon: "bai-viet", hien: duoc(user, "baiViet"),
      phu: soChoDuyet ? `${soChoDuyet} chờ duyệt` : "" },
    { k: "bang-gia", nhan: "Bảng giá & dịch vụ", href: "/quan-tri/bang-gia/", icon: "bang-gia", hien: duoc(user, "xemBangGia") },
    { k: "vung", nhan: "Vùng phục vụ & giờ", href: "/quan-tri/bang-gia/?tab=vung", icon: "vung", hien: duoc(user, "xemBangGia") },
    { k: "ma-khuyen-mai", nhan: "Mã khuyến mãi", href: "/quan-tri/ma-khuyen-mai/", icon: "ma", hien: duoc(user, "maKhuyenMai") },
    { k: "so-lieu", nhan: "Số liệu", href: "/quan-tri/so-lieu/", icon: "so-lieu", hien: duoc(user, "soLieu") },
    { k: "lich-hen", nhan: "Lịch hẹn, đơn hàng", href: "/admin/collections/don-hang", icon: "lich", hien: duoc(user, "donHang") },
  ].filter((m) => m.hien);

  return (
    <div className={s.trang}>
      <a className="bo-qua" href="#noi-dung">Bỏ qua menu</a>
      <header className={s.dau}>
        <div className={s.dauTrong}>
          <a href="/quan-tri/" className={s.thuongHieu}>
            <b>{site.name} · Quản trị</b>
            <span>{site.tagline}</span>
          </a>
          <div className={s.gian} />
          <a href="/" target="_blank" rel="noopener" className={s.xemWeb}>
            <IconQt name="mo-ngoai" size={16} />
            Xem website
          </a>
          <div className={s.nguoi}>
            <span className={s.anhDaiDien} aria-hidden="true">{chuCaiDau(ten)}</span>
            <span className={s.tenNguoi}>
              <b>{ten}</b>
              <span>{TEN_VAI_TRO[user.vaiTro] || user.vaiTro}</span>
            </span>
          </div>
          <NutDangXuat className={s.dangXuat} />
        </div>
      </header>

      <div className={s.than}>
        <aside className={s.trai}>
          <nav aria-label="Menu quản trị" className={s.menu}>
            {muc.map((m) => (
              <a key={m.k} href={m.href} aria-current={m.k === hienTai ? "page" : undefined} className={s.mucMenu}>
                <IconQt name={m.icon} />
                <span className={s.mucNhan}>{m.nhan}</span>
                {m.phu ? <span className={s.mucPhu}>{m.phu}</span> : null}
              </a>
            ))}
          </nav>
          <div className={s.hopQuyen}>
            <b className={s.hopTieuDe}>Quyền của bạn</b>
            <span><b>{TEN_VAI_TRO[user.vaiTro] || user.vaiTro}</b>: {MO_TA_QUYEN[user.vaiTro] || ""}</span>
          </div>
          {phuTrai}
        </aside>
        <main id="noi-dung" tabIndex={-1} className={s.chinh}>
          {children}
        </main>
      </div>
    </div>
  );
}

/** Màn báo không có quyền (vào thẳng URL). */
export function KhongCoQuyen({ tieuDe, lyDo }) {
  return (
    <div className={s.khongQuyen} role="alert">
      <IconQt name="khoa" size={28} />
      <h1>{tieuDe}</h1>
      <p>{lyDo}</p>
      <p><a href="/quan-tri/">Về trang tổng quan</a></p>
    </div>
  );
}
