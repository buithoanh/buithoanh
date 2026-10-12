"use client";
// Tab "Danh mục dịch vụ": bật/tắt nhận đặt lịch (PATCH /api/danh-muc-dich-vu/:id). Thêm, sửa chi tiết trong CMS.
import { useState } from "react";
import { useRouter } from "next/navigation";
import ThongBao from "../ThongBao";
import IconQt from "../IconQt";
import { goiApi } from "../api";
import q from "../qt.module.css";
import s from "./BangGia.module.css";

export default function TabDichVu({ dichVu, coVanGoiLaiPhut, coTheSua }) {
  const router = useRouter();
  const [bat, setBat] = useState(() => Object.fromEntries(dichVu.map((d) => [d.id, d.nhanDatLich !== false])));
  const [dang, setDang] = useState(null);
  const [tb, setTb] = useState(null);

  async function doi(d) {
    const moi = !bat[d.id];
    setBat((x) => ({ ...x, [d.id]: moi }));
    setDang(d.id);
    setTb(null);
    try {
      await goiApi(`/api/danh-muc-dich-vu/${d.id}`, { method: "PATCH", body: { nhanDatLich: moi } });
      setTb({ loai: "ok", chu: moi ? `Đã mở nhận đặt lịch “${d.ten}”.` : `Đã tạm ẩn “${d.ten}” khỏi form đặt lịch.` });
      router.refresh();
    } catch (e) {
      setBat((x) => ({ ...x, [d.id]: !moi }));
      setTb({ loai: "loi", chu: e.message });
    } finally {
      setDang(null);
    }
  }

  return (
    <>
      <ThongBao tb={tb} onDong={() => setTb(null)} />
      <section aria-labelledby="h-dich-vu" className={`${q.the} ${s.khongTran}`}>
        <div className={q.theDau}>
          <div>
            <h2 id="h-dich-vu">Danh mục dịch vụ</h2>
            <span className={q.phu}>Danh mục này hiện ở menu, trang chủ và bước 1 của form đặt lịch.</span>
          </div>
          {coTheSua ? (
            <a className={q.nut} href="/admin/collections/danh-muc-dich-vu/create" target="_blank" rel="noopener">
              <IconQt name="them" />
              Thêm dịch vụ
            </a>
          ) : null}
        </div>
        <div className={q.cuonNgang}>
          <table className={`${q.bang} ${s.bangDv}`}>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Dịch vụ</th>
                <th scope="col">Đường dẫn</th>
                <th scope="col">Báo giá sơ bộ</th>
                <th scope="col">Hạng mục giá</th>
                <th scope="col">Nhận đặt lịch</th>
              </tr>
            </thead>
            <tbody>
              {dichVu.map((d, i) => (
                <tr key={d.id}>
                  <td className={q.phu}>{i + 1}</td>
                  <th scope="row">
                    <span className={s.tenDv}><span className={s.maDv} aria-hidden="true">{d.ma}</span><b>{d.ten}</b></span>
                  </th>
                  <td className={q.phu}>/dich-vu/{d.slug}/</td>
                  <td>
                    <span className={`${q.nhanTT} ${d.baoGiaSoBo ? q.ttXanh : q.ttXam}`}>
                      {d.baoGiaSoBo ? "Tính ngay theo xe" : `Cố vấn gọi lại trong ${coVanGoiLaiPhut} phút`}
                    </span>
                  </td>
                  <td>{d.soHangMuc} hạng mục</td>
                  <td>
                    <button type="button" role="switch" aria-checked={bat[d.id]} aria-label={`Nhận đặt lịch ${d.ten}`} className={q.congTac}
                      disabled={!coTheSua || dang === d.id} onClick={() => doi(d)}>
                      <span className={q.ray} aria-hidden="true" />
                      <span className={s.trangThaiDv}>{bat[d.id] ? "Đang nhận" : "Tạm ẩn"}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={q.chan}>Đổi tên, mô tả, báo giá sơ bộ, thứ tự: mở dịch vụ trong CMS (<a href="/admin/collections/danh-muc-dich-vu">Danh mục dịch vụ</a>).</div>
      </section>
    </>
  );
}
