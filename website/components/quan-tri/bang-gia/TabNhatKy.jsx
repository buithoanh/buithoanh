// Tab "Nhật ký thay đổi giá" (chỉ Quản trị, Quản lý dịch vụ đọc được). Ghi tự động mỗi lần lưu giá, không ai sửa/xoá.
// Tải toàn bộ: GET /api/nhat-ky-gia/xuat?dinhDang=xlsx
import IconQt from "../IconQt";
import { ngayGio } from "../api";
import q from "../qt.module.css";
import s from "./BangGia.module.css";

const chuCai = (ten) => String(ten || "?").trim().split(/\s+/).filter((t) => /^\p{L}/u.test(t)).slice(-2).map((t) => t[0]).join("").toUpperCase();

export default function TabNhatKy({ dong, tong }) {
  return (
    <section aria-labelledby="h-nhat-ky" className={`${q.the} ${s.khongTran}`}>
      <div className={q.theDau}>
        <div>
          <h2 id="h-nhat-ky">Nhật ký thay đổi giá</h2>
          <span className={q.phu}>Ghi tự động mỗi lần lưu giá. Không ai xoá hay sửa được nhật ký.</span>
        </div>
        <a className={q.nut} href="/api/nhat-ky-gia/xuat?dinhDang=xlsx" download>
          <IconQt name="tai-ve" />
          Tải file Excel
        </a>
      </div>
      <div className={q.cuonNgang}>
        <table className={`${q.bang} ${s.bangNk}`}>
          <thead>
            <tr>
              <th scope="col">Lúc</th>
              <th scope="col">Người sửa</th>
              <th scope="col">Hạng mục</th>
              <th scope="col">Giá cũ → giá mới</th>
              <th scope="col">Lý do</th>
            </tr>
          </thead>
          <tbody>
            {dong.map((l) => (
              <tr key={l.id}>
                <td className={`${q.phu} ${s.nowrap}`}>{ngayGio(l.createdAt)}</td>
                <td>
                  <span className={s.nguoiSua}>
                    <span className={s.chuCai} aria-hidden="true">{chuCai(l.tenNguoi)}</span>
                    <span><b>{l.tenNguoi}</b><small>{l.vaiTro}</small></span>
                  </span>
                </td>
                <td>{l.moTa}</td>
                <td><s className={s.giaCu}>{l.giaCu}</s> → <b className={s.giaMoi}>{l.giaMoi}</b></td>
                <td className={q.phu}>{l.lyDo || "—"}</td>
              </tr>
            ))}
            {!dong.length ? <tr><td colSpan={5}><p className={q.rong}>Chưa có lần đổi giá nào.</p></td></tr> : null}
          </tbody>
        </table>
      </div>
      {tong > dong.length ? <div className={q.chan}>Đang hiện {dong.length} lần đổi giá mới nhất trên tổng {tong}. Tải file Excel để xem đủ.</div> : null}
    </section>
  );
}
