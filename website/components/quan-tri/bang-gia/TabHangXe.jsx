"use client";
// Tab "Hãng & đời xe": danh mục lấy từ VCparts (POST /api/dong-xe/dong-bo-vcparts), ở đây chỉ gán phân khúc giá A–D
// cho dòng mới (PATCH /api/dong-xe/:id { phanKhuc }).
import { useState } from "react";
import { useRouter } from "next/navigation";
import ThongBao from "../ThongBao";
import IconQt from "../IconQt";
import { goiApi, ngayGio } from "../api";
import q from "../qt.module.css";
import s from "./BangGia.module.css";

export default function TabHangXe({ hang, dong, phanKhuc, coTheSua }) {
  const router = useRouter();
  const [tb, setTb] = useState(null);
  const [dang, setDang] = useState(null);
  const [daGan, setDaGan] = useState({});

  const lanCuoi = dong.reduce((m, d) => (d.dongBoLuc && d.dongBoLuc > m ? d.dongBoLuc : m), "");
  const canGan = dong.filter((d) => d.canGan || !d.phanKhuc);
  const theoHang = hang.map((h) => {
    const ds = dong.filter((d) => d.hang === h.id);
    const tu = Math.min(...ds.map((d) => d.doiTu).filter(Boolean));
    const den = Math.max(...ds.map((d) => d.doiDen).filter(Boolean));
    return { ...h, soDong: ds.length, doi: Number.isFinite(tu) ? `đời ${tu}–${Number.isFinite(den) ? den : "nay"}` : "" };
  }).filter((h) => h.soDong);

  async function dongBo() {
    setDang("dong-bo");
    setTb(null);
    try {
      const kq = await goiApi("/api/dong-xe/dong-bo-vcparts", { method: "POST", body: {} });
      const moi = kq.dongMoi?.length || 0;
      setTb({ loai: "ok", chu: `Đã đồng bộ danh mục xe từ VCparts lúc ${ngayGio(kq.luc)}. ${kq.soHang} hãng, ${kq.soDong} dòng xe, ${moi ? `${moi} dòng mới cần gán phân khúc` : "không có dòng mới"}.` });
      router.refresh();
    } catch (e) {
      setTb({ loai: "loi", chu: e.message });
    } finally {
      setDang(null);
    }
  }

  async function gan(d, pk) {
    if (!pk) return;
    setDang(d.id);
    setTb(null);
    try {
      await goiApi(`/api/dong-xe/${d.id}`, { method: "PATCH", body: { phanKhuc: pk } });
      setDaGan((x) => ({ ...x, [d.id]: pk }));
      setTb({ loai: "ok", chu: `Đã gán ${d.tenDayDu || d.ten} vào phân khúc ${pk}. Báo giá sơ bộ cho dòng xe này dùng giá phân khúc ${pk}.` });
      router.refresh();
    } catch (e) {
      setTb({ loai: "loi", chu: e.message });
    } finally {
      setDang(null);
    }
  }

  return (
    <>
      <ThongBao tb={tb} onDong={() => setTb(null)} />
      <section aria-labelledby="h-hang-xe" className={`${q.the} ${q.theDem}`}>
        <div className={`${s.dongTieuDe} ${s.dauHangXe}`}>
          <div>
            <h2 id="h-hang-xe">Hãng &amp; đời xe</h2>
            <span className={q.phu}>Danh mục hãng, dòng, đời xe lấy từ VCparts, dùng chung cho form đặt lịch và báo giá sơ bộ. Ở đây chỉ gán phân khúc giá A–D cho từng dòng.</span>
          </div>
          <div className={s.dongBo}>
            <span>
              <span>Đồng bộ VCparts lần cuối</span>
              <b>{lanCuoi ? ngayGio(lanCuoi) : "Chưa đồng bộ"}</b>
            </span>
            {coTheSua ? (
              <button type="button" className={`${q.nut} ${q.nutToi}`} disabled={dang === "dong-bo"} onClick={dongBo}>
                <IconQt name="dong-bo" />
                {dang === "dong-bo" ? "Đang đồng bộ…" : "Đồng bộ ngay"}
              </button>
            ) : null}
          </div>
        </div>
        <span className={q.phu}>{theoHang.length} hãng · {dong.length} dòng xe</span>
        <ul className={s.luoiHang}>
          {theoHang.map((h) => (
            <li key={h.id}><b>{h.ten}</b><span>{h.soDong} dòng{h.doi ? ` · ${h.doi}` : ""}</span></li>
          ))}
        </ul>
        {canGan.length ? (
          <div className={s.canGan}>
            <b>Dòng xe mới từ VCparts cần gán phân khúc giá</b>
            {canGan.map((d) => (
              <div key={d.id} className={s.dongMoi}>
                <span>
                  <b>{d.tenDayDu || d.ten}</b>
                  {d.doiTu ? <span className={q.phu}> · đời {d.doiTu}–{d.doiDen || "nay"}</span> : null}
                </span>
                <label className={s.chonPk}>Phân khúc
                  <select value={daGan[d.id] || ""} disabled={!coTheSua || dang === d.id} onChange={(e) => gan(d, e.target.value)}>
                    <option value="">{d.goiYPhanKhuc ? `Chưa gán · gợi ý ${d.goiYPhanKhuc}` : "Chưa gán – chọn phân khúc"}</option>
                    {phanKhuc.map((p) => <option key={p.ma} value={p.ma}>{p.ma} · {p.tenNgan.toLowerCase()}</option>)}
                  </select>
                </label>
              </div>
            ))}
          </div>
        ) : (
          <div className={`${q.thongBao} ${q.tbOk}`} role="status"><span>Mọi dòng xe đã có phân khúc giá.</span></div>
        )}
      </section>
    </>
  );
}
