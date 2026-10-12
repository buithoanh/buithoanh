"use client";
// Tab "Vùng phục vụ": bật/tắt từng khu vực và từng phường (PATCH /api/quan/:id, /api/phuong/:id { dangPhucVu }),
// thời gian đến dự kiến (etaTu, etaDen). Tên khu vực lấy từ dữ liệu; chữ hiển thị dùng từ trung tính "khu vực".
import { useState } from "react";
import { useRouter } from "next/navigation";
import ThongBao from "../ThongBao";
import { goiApi } from "../api";
import q from "../qt.module.css";
import s from "./BangGia.module.css";

export default function TabVung({ quan, phuong, coTheSua }) {
  const router = useRouter();
  const [qBat, setQBat] = useState(() => Object.fromEntries(quan.map((x) => [x.id, Boolean(x.dangPhucVu)])));
  const [pBat, setPBat] = useState(() => Object.fromEntries(phuong.map((x) => [x.id, x.dangPhucVu !== false])));
  const [eta, setEta] = useState(() => Object.fromEntries(quan.map((x) => [x.id, { tu: String(x.etaTu ?? ""), den: String(x.etaDen ?? "") }])));
  const [mo, setMo] = useState(null);
  const [tb, setTb] = useState(null);
  const [dang, setDang] = useState(null);

  async function goi(khoa, url, body, thanhCong, hoanTac) {
    setDang(khoa);
    setTb(null);
    try {
      await goiApi(url, { method: "PATCH", body });
      setTb({ loai: "ok", chu: thanhCong });
      router.refresh();
    } catch (e) {
      hoanTac?.();
      setTb({ loai: "loi", chu: e.message });
    } finally {
      setDang(null);
    }
  }

  const doiQuan = (x) => {
    const moi = !qBat[x.id];
    setQBat((m) => ({ ...m, [x.id]: moi }));
    goi(`q${x.id}`, `/api/quan/${x.id}`, { dangPhucVu: moi },
      moi ? `Đã bật phục vụ ${x.ten}. Khách ở đây đặt lịch được ngay.` : `Đã tắt ${x.ten}. Khách gõ địa chỉ ở đây sẽ được báo ngoài vùng và mời gọi tư vấn.`,
      () => setQBat((m) => ({ ...m, [x.id]: !moi })));
  };
  const doiPhuong = (p, tenQuan) => {
    const moi = !pBat[p.id];
    setPBat((m) => ({ ...m, [p.id]: moi }));
    goi(`p${p.id}`, `/api/phuong/${p.id}`, { dangPhucVu: moi }, `${moi ? "Đã bật" : "Đã tắt"} phường ${p.ten} (${tenQuan}).`,
      () => setPBat((m) => ({ ...m, [p.id]: !moi })));
  };
  const luuEta = (x) => {
    const e = eta[x.id];
    const tu = Number(e.tu), den = Number(e.den);
    if (tu === x.etaTu && den === x.etaDen) return;
    if (!(tu > 0 && den >= tu && den <= 600)) {
      setTb({ loai: "loi", chu: `Thời gian đến ở ${x.ten}: nhập số phút, "từ" không lớn hơn "đến".` });
      return;
    }
    goi(`e${x.id}`, `/api/quan/${x.id}`, { etaTu: tu, etaDen: den }, `Đã lưu thời gian đến dự kiến ở ${x.ten}: ${tu}–${den} phút.`);
  };

  const dangPv = quan.filter((x) => x.dangPhucVu);
  const chuaPv = quan.filter((x) => !x.dangPhucVu);

  return (
    <>
      <ThongBao tb={tb} onDong={() => setTb(null)} />
      <section aria-labelledby="h-vung" className={`${q.the} ${q.theDem}`}>
        <div>
          <h2 id="h-vung">Vùng phục vụ theo khu vực, phường</h2>
          <span className={q.phu}>Khách gõ địa chỉ ngoài vùng thì web báo rõ và mời gọi tư vấn hoặc kéo xe. Thời gian đến dự kiến hiện trên trang khu vực và trang theo dõi thợ.</span>
        </div>
        <div className={s.dsQuan}>
          {dangPv.map((x) => {
            const ds = phuong.filter((p) => p.quan === x.id);
            const soBat = ds.filter((p) => qBat[x.id] && pBat[p.id]).length;
            const dangMo = mo === x.id;
            return (
              <div key={x.id} className={`${s.quan} ${qBat[x.id] ? "" : s.quanTat}`}>
                <div className={s.quanDong}>
                  <button type="button" role="switch" aria-checked={qBat[x.id]} aria-label={`Phục vụ khu vực ${x.ten}`} className={q.congTac}
                    disabled={!coTheSua || dang === `q${x.id}`} onClick={() => doiQuan(x)}>
                    <span className={q.ray} aria-hidden="true" />
                    <b className={s.tenQuan}>{x.ten}</b>
                  </button>
                  <span className={`${q.nhanTT} ${qBat[x.id] ? q.ttXanh : q.ttDo}`}>
                    {qBat[x.id] ? `${soBat}/${ds.length} phường đang phục vụ` : "Đã tắt cả khu vực"}
                  </span>
                  <span className={s.gian} />
                  <div className={s.eta} role="group" aria-label={`Thời gian đến dự kiến ở ${x.ten}`}>
                    Đến dự kiến
                    <input inputMode="numeric" aria-label={`${x.ten}: từ (phút)`} value={eta[x.id].tu} readOnly={!coTheSua}
                      onChange={(e) => setEta((m) => ({ ...m, [x.id]: { ...m[x.id], tu: e.target.value.replace(/\D/g, "") } }))} onBlur={() => coTheSua && luuEta(x)} />
                    –
                    <input inputMode="numeric" aria-label={`${x.ten}: đến (phút)`} value={eta[x.id].den} readOnly={!coTheSua}
                      onChange={(e) => setEta((m) => ({ ...m, [x.id]: { ...m[x.id], den: e.target.value.replace(/\D/g, "") } }))} onBlur={() => coTheSua && luuEta(x)} />
                    <span>phút</span>
                  </div>
                  <button type="button" className={`${q.nut} ${q.nutNho}`} aria-expanded={dangMo} aria-controls={`phuong-${x.id}`} onClick={() => setMo(dangMo ? null : x.id)}>
                    {dangMo ? "Thu gọn phường" : "Xem phường"}
                  </button>
                </div>
                {dangMo ? (
                  <div id={`phuong-${x.id}`}>
                    <div className={s.phuong}>
                      {ds.map((p) => (
                        <button key={p.id} type="button" role="switch" aria-checked={qBat[x.id] && pBat[p.id]} className={s.chipPhuong}
                          disabled={!coTheSua || !qBat[x.id] || dang === `p${p.id}`} onClick={() => doiPhuong(p, x.ten)}>
                          {p.ten}
                        </button>
                      ))}
                      {!ds.length ? <span className={q.phu}>Chưa có phường nào trong dữ liệu.</span> : null}
                    </div>
                    {ds.filter((p) => p.ghiChu).map((p) => <span key={p.id} className={s.ghiChuQuan}>{p.ten}: {p.ghiChu}</span>)}
                    {x.ghiChu ? <span className={s.ghiChuQuan}>{x.ghiChu}</span> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        {chuaPv.length ? (
          <div className={s.quanTatDs}>
            <b>Khu vực chưa phục vụ (bật khi có tổ thợ trực)</b>
            <div className={q.dayVien}>
              {chuaPv.map((x) => (
                <button key={x.id} type="button" role="switch" aria-checked={qBat[x.id]} className={s.chipQuan}
                  disabled={!coTheSua || dang === `q${x.id}`} onClick={() => doiQuan(x)}>
                  {qBat[x.id] ? `Đã bật · ${x.ten}` : `+ ${x.ten}`}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
