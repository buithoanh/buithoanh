// Bảng giá các hạng mục (trang dịch vụ, khu vực, hãng xe, xe điện; agent khác dùng lại được, kể cả trong client component).
// hangMuc: [{ ten, giaHienThi, loai?: "cong"|"phuTung"|"phi", loaiNhan?, mienPhi? }] (kết quả hangMucHienThi() trong lib/cong-khai.ts).
// dau: "toi" (hàng tiêu đề nền tối), "nhat" (nền nhạt) hoặc null (không có hàng tiêu đề).
// hienLoai: in dòng nhỏ "Tiền công" / "Phụ tùng · giá xe phân khúc B" dưới tên. chamMau: chấm màu công / phụ tùng như màn BangGia.
// cuoi: nội dung chân bảng (ghi chú, gợi ý tổng tiền…). tieuDe: chú thích bảng cho trình đọc màn hình.
import s from "./BangGiaHangMuc.module.css";

export default function BangGiaHangMuc({ hangMuc, dau = null, hienLoai = false, chamMau = false, cuoi = null, tieuDe = "Bảng giá", className = "" }) {
  return (
    <div className={`${s.khung} ${className}`}>
      <table className={s.bang}>
        <caption className="sr-only">{tieuDe}</caption>
        {dau ? (
          <thead className={dau === "toi" ? s.dauToi : s.dauNhat}>
            <tr><th scope="col">Hạng mục</th><th scope="col">Giá</th></tr>
          </thead>
        ) : null}
        <tbody>
          {hangMuc.map((h, i) => {
            const phuTung = h.loai === "phuTung";
            return (
              <tr key={`${h.id ?? h.ten}-${i}`}>
                <th scope="row">
                  <span className={s.ten}>
                    {chamMau ? <span className={`${s.cham} ${phuTung ? s.chamPt : ""}`} aria-hidden="true" /> : null}
                    <span>
                      {h.ten}
                      {hienLoai && h.loaiNhan ? <small className={s.loai}>{h.loaiNhan}</small> : null}
                    </span>
                  </span>
                </th>
                <td className={h.mienPhi ? s.mienPhi : chamMau && phuTung ? s.giaPt : undefined}>{h.giaHienThi}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {cuoi}
    </div>
  );
}

/** Chân bảng nền nhạt (ghi chú nhỏ). */
export function ChanBang({ children, className = "" }) {
  return <div className={`${s.chan} ${className}`}>{children}</div>;
}
