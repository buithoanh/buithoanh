"use client";
// Tab "Bảng giá": giá công (giá cụ thể, nút −/+ 10.000đ) và phụ tùng (khoảng từ–đến theo phân khúc A–D) của từng dịch vụ,
// phí đi lại, phí kiểm tra. Lưu cả lô qua POST /api/hang-muc-gia/luu-nhieu (bắt buộc lý do, ghi nhật ký giá)
// và POST /api/globals/bang-gia-chung (kèm lyDoDoi).
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ThongBao from "../ThongBao";
import OTien from "../OTien";
import IconQt from "../IconQt";
import { dinhDangTien, goiApi, ngayGio } from "../api";
import q from "../qt.module.css";
import s from "./BangGia.module.css";

const PK = ["A", "B", "C", "D"];
const BUOC = 10000;
const giongNhau = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const khoangCu = (h) => Object.fromEntries(PK.map((p) => [p, { tu: h.giaPhanKhuc?.[p]?.tu ?? null, den: h.giaPhanKhuc?.[p]?.den ?? null }]));
const PHI = [
  ["phiDiLai", "Phí đi lại", "Mỗi lần thợ tới, trong vùng phục vụ."],
  ["phiKiemTra", "Phí kiểm tra khi khách không sửa", "Thu khi khách từ chối báo giá chính thức."],
];

export default function TabBangGia({ dichVu, hangMuc, chung, coTheSua }) {
  const router = useRouter();
  const [dvChon, setDvChon] = useState(dichVu[0]?.id);
  const [nhap, setNhap] = useState({}); // id → { gia } | { giaPhanKhuc }
  const [phi, setPhi] = useState({}); // phiDiLai, phiKiemTra đang sửa
  const [lyDo, setLyDo] = useState("");
  const [loiLyDo, setLoiLyDo] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const [tb, setTb] = useState(null);

  const thayDoi = useMemo(() => hangMuc.flatMap((h) => {
    const n = nhap[h.id];
    if (!n) return [];
    if (h.loai === "phuTung") return giongNhau(n.giaPhanKhuc, khoangCu(h)) ? [] : [{ h, id: h.id, giaPhanKhuc: n.giaPhanKhuc }];
    return n.gia === h.gia ? [] : [{ h, id: h.id, gia: n.gia }];
  }), [hangMuc, nhap]);
  const phiDoi = PHI.filter(([k]) => phi[k] != null && phi[k] !== chung[k]);
  const soDoi = thayDoi.length + phiDoi.length;
  const loiKhoang = thayDoi.some((t) => t.giaPhanKhuc && PK.some((p) => t.giaPhanKhuc[p].tu == null || t.giaPhanKhuc[p].den == null || t.giaPhanKhuc[p].tu > t.giaPhanKhuc[p].den));

  const datGia = (h, gia) => {
    setTb(null);
    setNhap((x) => ({ ...x, [h.id]: { gia: Math.max(0, gia) } }));
  };
  const datKhoang = (h, p, dau, v) => {
    setTb(null);
    setNhap((x) => {
      const cu = x[h.id]?.giaPhanKhuc || khoangCu(h);
      return { ...x, [h.id]: { giaPhanKhuc: { ...cu, [p]: { ...cu[p], [dau]: v } } } };
    });
  };

  async function luu() {
    if (!soDoi || dangLuu) return;
    if (lyDo.trim().length < 5) {
      setLoiLyDo("Ghi lý do đổi giá (ít nhất 5 ký tự). Lý do được lưu vào nhật ký giá.");
      document.getElementById("ly-do-gia")?.focus();
      return;
    }
    const quaLon = thayDoi.find((t) => (t.gia ?? 0) > 100000000 || (t.giaPhanKhuc && PK.some((p) => (t.giaPhanKhuc[p].den ?? 0) > 1000000000)));
    if (quaLon) {
      setTb({ loai: "loi", chu: `Giá “${quaLon.h.ten}” lớn bất thường. Kiểm tra lại số đã gõ.` });
      return;
    }
    if (loiKhoang) {
      setTb({ loai: "loi", chu: "Có khoảng giá phụ tùng thiếu số hoặc giá “từ” lớn hơn giá “đến”. Sửa ô viền đỏ rồi lưu lại." });
      return;
    }
    setDangLuu(true);
    setTb(null);
    try {
      if (thayDoi.length) {
        await goiApi("/api/hang-muc-gia/luu-nhieu", {
          method: "POST",
          body: { thayDoi: thayDoi.map(({ id, gia, giaPhanKhuc }) => (giaPhanKhuc ? { id, giaPhanKhuc } : { id, gia })), lyDo: lyDo.trim() },
        });
      }
      if (phiDoi.length) {
        await goiApi("/api/globals/bang-gia-chung", {
          method: "POST",
          body: { ...Object.fromEntries(phiDoi.map(([k]) => [k, phi[k]])), lyDoDoi: lyDo.trim() },
        });
      }
      setTb({ loai: "ok", chu: `Đã lưu ${soDoi} thay đổi giá và ghi vào nhật ký. Mọi trang trên web dùng giá mới ngay.` });
      setNhap({});
      setPhi({});
      setLyDo("");
      router.refresh();
    } catch (e) {
      setTb({ loai: "loi", chu: e.message });
    } finally {
      setDangLuu(false);
    }
  }

  const dv = dichVu.find((d) => d.id === dvChon) || dichVu[0];
  const dong = hangMuc.filter((h) => h.dichVu === dv?.id);
  const tenPk = Object.fromEntries((chung.phanKhuc || []).map((p) => [p.ma, p.tenNgan]));

  return (
    <>
      <ThongBao tb={tb} onDong={() => setTb(null)} />
      <section aria-labelledby="h-bang-gia" className={`${q.the} ${s.khongTran}`}>
        <div className={s.dauKhoi}>
          <div className={s.dongTieuDe}>
            <h2 id="h-bang-gia">Bảng giá theo dịch vụ</h2>
            <span className={q.phu}>Tiền công: giá cụ thể · Phụ tùng: khoảng “từ – đến” theo phân khúc xe</span>
          </div>
          <div className={q.ghiChuCam}>
            <IconQt name="thong-tin" />
            <span><b>Đổi giá xong, mọi trang dùng giá mới ngay.</b> Mỗi lần lưu đều ghi vào nhật ký: ai sửa, lúc nào, giá cũ, giá mới và lý do.</span>
          </div>
          <div role="tablist" aria-label="Chọn dịch vụ" className={q.dayVien}>
            {dichVu.map((d) => {
              const n = thayDoi.filter((t) => t.h.dichVu === d.id).length;
              return (
                <button key={d.id} type="button" role="tab" aria-selected={d.id === dv?.id} aria-controls="bang-gia-dv" className={q.vien} onClick={() => setDvChon(d.id)}>
                  {d.ten}{n ? ` · ${n} chưa lưu` : ""}
                </button>
              );
            })}
          </div>
        </div>
        <div className={q.cuonNgang} id="bang-gia-dv" role="tabpanel" aria-label={dv?.ten}>
          <table className={`${q.bang} ${s.bangGia}`}>
            <thead>
              <tr>
                <th scope="col">Hạng mục</th>
                <th scope="col">Giá công</th>
                {PK.map((p, i) => <th key={p} scope="col">{i === 0 ? "Phụ tùng " : ""}{p}{tenPk[p] ? ` · ${tenPk[p]}` : ""}</th>)}
                <th scope="col">Sửa lần cuối</th>
              </tr>
            </thead>
            <tbody>
              {dong.map((h) => {
                const n = nhap[h.id];
                const laCong = h.loai !== "phuTung";
                const giaMoi = laCong ? (n?.gia ?? h.gia) : null;
                const doiCong = laCong && n && n.gia !== h.gia;
                const khoang = !laCong ? (n?.giaPhanKhuc || khoangCu(h)) : null;
                const doiPt = !laCong && n && !giongNhau(n.giaPhanKhuc, khoangCu(h));
                const donVi = h.donVi ? `/${h.donVi}` : "";
                return (
                  <tr key={h.id} className={doiCong || doiPt ? s.dongDoi : undefined}>
                    <th scope="row" className={s.tenHm}>
                      <span>{h.ten}</span>
                      <small>{laCong ? "Tiền công" : h.nguonGia === "vcparts" ? "Phụ tùng · giá tham khảo VCparts" : "Phụ tùng"}</small>
                    </th>
                    <td>
                      {laCong ? (
                        <>
                          <div className={s.oCong}>
                            {coTheSua ? <button type="button" className={s.nutBuoc} aria-label={`Giảm 10.000đ ${h.ten}`} onClick={() => datGia(h, (giaMoi || 0) - BUOC)}>−</button> : null}
                            <OTien value={giaMoi} mienPhi aria-label={`Giá công ${h.ten}${donVi ? ` (đồng${donVi})` : ""}`} readOnly={!coTheSua}
                              className={`${s.oGia} ${doiCong ? s.oGiaDoi : ""}`} onChange={(v) => datGia(h, v)} />
                            {coTheSua ? <button type="button" className={s.nutBuoc} aria-label={`Tăng 10.000đ ${h.ten}`} onClick={() => datGia(h, (giaMoi || 0) + BUOC)}>+</button> : null}
                          </div>
                          {donVi ? <small className={s.donVi}>đồng{donVi}</small> : null}
                          {doiCong ? <span className={s.cu}>Cũ: <s>{dinhDangTien(h.gia, true)}</s> · chưa lưu</span> : null}
                        </>
                      ) : <span className={s.gach}>—</span>}
                    </td>
                    {PK.map((p) => (
                      <td key={p}>
                        {laCong ? <span className={s.gach}>—</span> : (
                          <div className={s.oKhoang}>
                            {["tu", "den"].map((dau) => {
                              const sai = khoang[p].tu != null && khoang[p].den != null && khoang[p].tu > khoang[p].den;
                              const khac = n && khoang[p][dau] !== (h.giaPhanKhuc?.[p]?.[dau] ?? null);
                              return (
                                <label key={dau} className={s.nhanKhoang}>
                                  <span>{dau === "tu" ? "Từ" : "Đến"}</span>
                                  <OTien value={khoang[p][dau]} readOnly={!coTheSua} aria-label={`${h.ten} phân khúc ${p} giá ${dau === "tu" ? "từ" : "đến"}`}
                                    aria-invalid={sai || undefined}
                                    className={`${s.oPt} ${khac ? s.oGiaDoi : ""} ${sai ? q.oLoi : ""}`} onChange={(v) => datKhoang(h, p, dau, v)} />
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className={s.lanCuoi}>
                      {doiCong || doiPt ? "Đang sửa · chưa lưu" : h.capNhatGiaLuc ? `${ngayGio(h.capNhatGiaLuc)} · ${h.capNhatGiaBoi || ""}` : "Nhập ban đầu"}
                    </td>
                  </tr>
                );
              })}
              {!dong.length ? <tr><td colSpan={7}><p className={q.rong}>Dịch vụ này chưa có hạng mục giá. Thêm trong CMS.</p></td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className={s.phi}>
          {PHI.map(([k, ten, ghiChu]) => (
            <label key={k} className={q.truong}>{ten}
              <OTien value={phi[k] ?? chung[k]} readOnly={!coTheSua} className={`${q.o} ${s.oPhi} ${phi[k] != null && phi[k] !== chung[k] ? s.oGiaDoi : ""}`}
                onChange={(v) => setPhi((x) => ({ ...x, [k]: v }))} />
              <small>{ghiChu}{phi[k] != null && phi[k] !== chung[k] ? ` Cũ: ${dinhDangTien(chung[k])}, chưa lưu.` : ""}</small>
            </label>
          ))}
          <div className={q.truong}>Bảo hành
            <span className={s.chiDoc}>Phụ tùng {chung.baoHanhPhuTungThang} tháng · công {chung.baoHanhCongThang} tháng</span>
            <small>Sửa trong CMS (Bảng giá chung).</small>
          </div>
        </div>
        {coTheSua ? (
          <div className={q.thanhLuu}>
            <span>
              {soDoi ? `${soDoi} giá đang sửa, chưa lưu. Ghi lý do rồi bấm Lưu để áp dụng.` : "Không có thay đổi chưa lưu. Dùng nút − / + hoặc gõ thẳng vào ô giá."}
            </span>
            {soDoi ? (
              <label className={`${q.truong} ${s.lyDo}`}>Lý do đổi giá (ghi vào nhật ký)
                <input id="ly-do-gia" className={`${q.o} ${loiLyDo ? q.oLoi : ""}`} value={lyDo} maxLength={200}
                  aria-invalid={loiLyDo ? true : undefined} aria-describedby={loiLyDo ? "loi-ly-do" : undefined}
                  placeholder="Ví dụ: VCparts báo tăng giá nhập"
                  onChange={(e) => { setLyDo(e.target.value); if (e.target.value.trim().length >= 5) setLoiLyDo(""); }}
                  onBlur={() => { if (lyDo && lyDo.trim().length < 5) setLoiLyDo("Lý do cần ít nhất 5 ký tự."); }} />
                {loiLyDo ? <span id="loi-ly-do" className={q.loiO}>{loiLyDo}</span> : null}
              </label>
            ) : null}
            <button type="button" className={`${q.nut} ${q.nutLon}`} disabled={!soDoi || dangLuu} onClick={() => { setNhap({}); setPhi({}); setLoiLyDo(""); }}>
              Bỏ thay đổi
            </button>
            <button type="button" className={`${q.nut} ${q.nutLon} ${soDoi ? q.nutChinh : q.nutTat}`} disabled={!soDoi || dangLuu} onClick={luu}>
              {dangLuu ? "Đang lưu…" : soDoi ? `Lưu ${soDoi} thay đổi giá` : "Đã lưu hết"}
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}
