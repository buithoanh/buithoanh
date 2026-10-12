"use client";
// Màn QtMaKhuyenMai (phần tương tác): lọc danh sách mã, xem QR (PNG từ /api/ma-khuyen-mai/:id/qr.png, in A5),
// tạo/sửa mã (POST/PATCH /api/ma-khuyen-mai), báo cáo hoa hồng tháng kèm xuất Excel/CSV.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import IconQt from "../IconQt";
import ThongBao from "../ThongBao";
import OTien from "../OTien";
import { goiApi, ngay } from "../api";
import q from "../qt.module.css";
import s from "./QuanLyMa.module.css";

const GHI_CHU_LOAI = { km: "Chương trình chung", koc: "Người có ảnh hưởng", xang: "QR dán tại cây xăng", bql: "Ban quản lý toà nhà" };
const LOP_LOAI = { km: q.ttXam, koc: q.ttCam, xang: q.ttXanhDuong, bql: q.ttXanh };
const LOP_TT = { dangChay: q.ttXanh, hetLuot: q.ttCam, hetHan: q.ttXam, tamDung: q.ttVang, chuaBatDau: q.ttLam };
// Gợi ý hoa hồng mặc định theo loại khi tạo mã (sửa được trong form)
const HOA_HONG_GOI_Y = { km: 0, koc: 8, xang: 5, bql: 5 };

const boDau = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
const goiYMa = (tienTo, doiTac) => tienTo + boDau(doiTac).toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 20);
const ngayVN = (iso) => (iso ? new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(0, 10) : "");
const isoNgay = (d) => (d ? new Date(`${d}T00:00:00+07:00`).toISOString() : null);

const formTrong = () => ({
  id: null, doiTac: "", loai: "xang", ma: "XANG-", maTuGo: false, kieuGiam: "phanTram", giaTri: 10, giamToiDa: 100000,
  batDau: "", hetHan: "", soLuotToiDa: "", hoaHongPhanTram: HOA_HONG_GOI_Y.xang, moiSdtMotLan: true, tamDung: false,
});

function kiemTraForm(f) {
  const loi = {};
  if (!/^[A-Z0-9-]{3,40}$/.test(f.ma)) loi.ma = "Mã gồm 3–40 ký tự: chữ in hoa không dấu, số, gạch ngang.";
  if (!(Number(f.giaTri) > 0)) loi.giaTri = "Nhập mức giảm lớn hơn 0.";
  else if (f.kieuGiam === "phanTram" && Number(f.giaTri) > 100) loi.giaTri = "Giảm theo % chỉ từ 1 đến 100.";
  if (f.batDau && f.hetHan && f.batDau > f.hetHan) loi.hetHan = "Hạn dùng phải sau ngày bắt đầu.";
  if (f.soLuotToiDa !== "" && !(Number(f.soLuotToiDa) >= 1)) loi.soLuotToiDa = "Số lượt tối đa từ 1 trở lên, hoặc để trống.";
  const hh = Number(f.hoaHongPhanTram);
  if (!(hh >= 0 && hh <= 100)) loi.hoaHongPhanTram = "Hoa hồng từ 0 đến 100%.";
  if (f.loai !== "km" && !f.doiTac.trim()) loi.doiTac = "Nhập tên đối tác để đối soát hoa hồng.";
  return loi;
}

export default function QuanLyMa({ ma, loai, thongKe, hoaHong, thangs, thang, coTheSua, tenWeb }) {
  const router = useRouter();
  const [loc, setLoc] = useState("all");
  const [tim, setTim] = useState("");
  const [chon, setChon] = useState(ma[0]?.id ?? null);
  const [f, setF] = useState(formTrong);
  const [loi, setLoi] = useState({});
  const [cham, setCham] = useState({});
  const [tb, setTb] = useState(null);
  const [dangLuu, setDangLuu] = useState(false);

  const ds = useMemo(() => {
    const t = boDau(tim.trim()).toLowerCase();
    return ma.filter((m) => (loc === "all" || m.loai === loc) && (!t || boDau(`${m.ma} ${m.doiTac || ""}`).toLowerCase().includes(t)));
  }, [ma, loc, tim]);
  const qr = ma.find((m) => m.id === chon) || ma[0];

  const dat = (k, v) => {
    setF((x) => {
      const y = { ...x, [k]: v };
      if (k === "loai" && !x.id) y.hoaHongPhanTram = HOA_HONG_GOI_Y[v] ?? 0;
      if ((k === "loai" || k === "doiTac") && !y.maTuGo && !x.id) y.ma = goiYMa(loai[y.loai].tienTo, y.doiTac);
      if (k === "ma") { y.ma = String(v).toUpperCase().replace(/\s+/g, ""); y.maTuGo = true; }
      if (cham[k] || Object.keys(loi).length) setLoi(kiemTraForm(y));
      return y;
    });
  };
  const roi = (k) => { setCham((c) => ({ ...c, [k]: true })); setLoi(kiemTraForm(f)); };
  const loiO = (k) => (cham[k] || loi._gui) && loi[k] ? <span id={`loi-${k}`} className={q.loiO}>{loi[k]}</span> : null;
  const aria = (k) => ((cham[k] || loi._gui) && loi[k] ? { "aria-invalid": true, "aria-describedby": `loi-${k}` } : {});

  const sua = (m) => {
    setF({
      id: m.id, doiTac: m.doiTac || "", loai: m.loai, ma: m.ma, maTuGo: true, kieuGiam: m.kieuGiam, giaTri: m.giaTri, giamToiDa: m.giamToiDa ?? "",
      batDau: ngayVN(m.batDau), hetHan: ngayVN(m.hetHan), soLuotToiDa: m.soLuotToiDa ?? "", hoaHongPhanTram: m.hoaHongPhanTram ?? 0,
      moiSdtMotLan: m.moiSdtMotLan !== false, tamDung: Boolean(m.tamDung),
    });
    setLoi({});
    setCham({});
    setTb(null);
    document.getElementById("tao-ma")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  async function gui(e) {
    e.preventDefault();
    if (dangLuu) return;
    const l = kiemTraForm(f);
    if (Object.keys(l).length) {
      setLoi({ ...l, _gui: true });
      setTb({ loai: "loi", chu: "Còn ô chưa đúng, xem chữ đỏ dưới từng ô." });
      return;
    }
    const body = {
      ma: f.ma, loai: f.loai, doiTac: f.doiTac.trim() || null, kieuGiam: f.kieuGiam, giaTri: Number(f.giaTri),
      giamToiDa: f.kieuGiam === "phanTram" && f.giamToiDa !== "" ? Number(f.giamToiDa) : null,
      batDau: isoNgay(f.batDau), hetHan: isoNgay(f.hetHan), soLuotToiDa: f.soLuotToiDa === "" ? null : Number(f.soLuotToiDa),
      hoaHongPhanTram: Number(f.hoaHongPhanTram), moiSdtMotLan: f.moiSdtMotLan, tamDung: f.tamDung,
    };
    setDangLuu(true);
    setTb(null);
    try {
      const kq = await goiApi(f.id ? `/api/ma-khuyen-mai/${f.id}` : "/api/ma-khuyen-mai", { method: f.id ? "PATCH" : "POST", body });
      const doc = kq.doc || kq;
      setChon(doc.id);
      setTb({ loai: "ok", chu: f.id ? `Đã lưu mã ${doc.ma}.` : `Đã tạo mã ${doc.ma}. Mã QR đã sẵn sàng bên dưới để tải về và in.` });
      setF(formTrong());
      setCham({});
      setLoi({});
      router.refresh();
    } catch (err) {
      setTb({ loai: "loi", chu: /unique|đã có|already/i.test(err.message) ? `Mã ${f.ma} đã có. Chọn mã khác.` : err.message });
    } finally {
      setDangLuu(false);
    }
  }

  const chep = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setTb({ loai: "ok", chu: "Đã sao chép link đặt lịch có mã." });
    } catch {
      setTb({ loai: "loi", chu: "Trình duyệt chặn sao chép. Bôi đen link rồi chép tay." });
    }
  };

  const thangNhan = (t) => `T${Number(t.slice(5))}/${t.slice(0, 4)}`;
  const tk = thongKe;

  return (
    <>
      <div className={q.dauTrang}>
        <div>
          <h1>Mã khuyến mãi và mã đối tác</h1>
          <p>Mỗi mã gắn với một đối tác. Khách đặt bằng mã hoặc quét QR thì đơn tự ghi nguồn và mã, để cuối tháng tính hoa hồng.</p>
        </div>
        {coTheSua ? (
          <a href="#tao-ma" className={`${q.nut} ${q.nutChinh}`}><IconQt name="them" />Tạo mã mới</a>
        ) : null}
      </div>

      <div className={s.soLieu}>
        {[
          ["Mã đang chạy", tk.maDangChay.toLocaleString("vi-VN"), `trên ${tk.tongMa} mã đã tạo`],
          [`Lượt dùng mã ${thangNhan(tk.thang)}`, tk.luotDungThangNay.toLocaleString("vi-VN"), `${tk.phanTramDonThangNay}% tổng số đơn`],
          ["Tổng lượt dùng từ đầu", tk.tongLuotDung.toLocaleString("vi-VN"), "tính cả mã đã dừng"],
          [`Hoa hồng phải trả ${thangNhan(tk.thang)}`, tk.hoaHongThangNayHienThi, `cho ${tk.soDoiTacThangNay} đối tác`],
        ].map(([nhan, so, phu]) => (
          <div key={nhan} className={s.oSo}>
            <span>{nhan}</span>
            <b>{so}</b>
            <span>{phu}</span>
          </div>
        ))}
      </div>

      <ThongBao tb={tb} onDong={() => setTb(null)} />

      <section aria-labelledby="h-ds-ma" className={`${q.the} ${s.khongTran}`}>
        <div className={s.dauDs}>
          <h2 id="h-ds-ma">Danh sách mã</h2>
          <div role="group" aria-label="Lọc theo loại" className={q.dayVien}>
            {[["all", "Tất cả"], ...Object.entries(loai).map(([k, v]) => [k, v.nhan])].map(([k, nhan]) => (
              <button key={k} type="button" aria-pressed={loc === k} className={q.vien} onClick={() => setLoc(k)}>{nhan}</button>
            ))}
          </div>
          <label className={s.tim}>Tìm
            <input type="search" className={q.o} value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Mã hoặc tên đối tác" />
          </label>
        </div>
        <div className={q.cuonNgang}>
          <table className={`${q.bang} ${s.bangMa}`}>
            <thead>
              <tr>
                <th scope="col">Mã</th>
                <th scope="col">Loại</th>
                <th scope="col">Mức giảm</th>
                <th scope="col">Hạn dùng</th>
                <th scope="col" className={s.cotDung}>Đã dùng / giới hạn</th>
                <th scope="col">Trạng thái</th>
                <th scope="col" className={q.so}>Mã QR</th>
              </tr>
            </thead>
            <tbody>
              {ds.map((m) => {
                const pt = m.phanTramDaDung;
                return (
                  <tr key={m.id} className={qr?.id === m.id ? s.dongChon : undefined}>
                    <td><span className={q.ma}>{m.ma}</span><div className={s.doiTac}>{m.doiTac || "—"}</div></td>
                    <td><span className={`${s.nhanLoai} ${LOP_LOAI[m.loai] || q.ttXam}`}>{m.loaiNhan}</span></td>
                    <td className={s.giam}>{m.moTaGiam.replace(" tiền công", " công")}</td>
                    <td>{m.hetHan ? ngay(m.hetHan) : "Không hạn"}</td>
                    <td>
                      <div className={s.dung}><b>{m.daDung.toLocaleString("vi-VN")} / {m.soLuotToiDa ? m.soLuotToiDa.toLocaleString("vi-VN") : "∞"}</b><span>{pt != null ? `${pt}%` : ""}</span></div>
                      {pt != null ? (
                        <div className={s.thanh} role="progressbar" aria-valuenow={Math.min(pt, 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`Đã dùng ${pt}% số lượt`}>
                          <i className={pt >= 100 ? s.day : undefined} style={{ width: `${Math.max(Math.min(pt, 100), 2)}%` }} />
                        </div>
                      ) : null}
                    </td>
                    <td><span className={`${s.nhanLoai} ${LOP_TT[m.trangThai] || q.ttXam}`}>{m.trangThaiNhan}</span></td>
                    <td className={q.so}>
                      <div className={s.nutDong}>
                        {coTheSua ? <button type="button" className={`${q.nut} ${q.nutNho}`} aria-label={`Sửa mã ${m.ma}`} onClick={() => sua(m)}>Sửa</button> : null}
                        <button type="button" aria-pressed={qr?.id === m.id} className={`${q.vien} ${s.nutQr}`} onClick={() => setChon(m.id)}>
                          <IconQt name="qr" size={16} />Xem QR
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!ds.length ? <tr><td colSpan={7}><p className={q.rong}>Không có mã nào khớp.</p></td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className={q.chan}>Mã hết hạn hoặc hết lượt sẽ tự dừng, khách nhập vào sẽ được báo rõ lý do. Mức giảm phần trăm chỉ tính trên tiền công, không tính trên phụ tùng.</div>
      </section>

      <div className={s.hai}>
        {coTheSua ? (
          <form id="tao-ma" className={`${q.the} ${s.form}`} onSubmit={gui} noValidate>
            <h2>{f.id ? `Sửa mã ${f.ma}` : "Tạo mã mới"}</h2>
            <label className={q.truong}>Tên đối tác
              <input className={`${q.o} ${loiO("doiTac") ? q.oLoi : ""}`} value={f.doiTac} onChange={(e) => dat("doiTac", e.target.value)} onBlur={() => roi("doiTac")}
                placeholder="Cây xăng 03 Nguyễn Trãi" {...aria("doiTac")} />
              {loiO("doiTac")}
            </label>
            <fieldset className={s.nhom}>
              <legend>Loại mã</legend>
              <div className={s.luoiLoai}>
                {Object.entries(loai).map(([k, v]) => (
                  <button key={k} type="button" aria-pressed={f.loai === k} className={s.loai} onClick={() => dat("loai", k)}>
                    <b>{v.nhan}</b><span>{GHI_CHU_LOAI[k] || v.nguon}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className={q.truong}>
              <label htmlFor="o-ma">Mã khách nhập</label>
              <input id="o-ma" className={`${q.o} ${s.oMa} ${loiO("ma") ? q.oLoi : ""}`} value={f.ma} maxLength={40} onChange={(e) => dat("ma", e.target.value)} onBlur={() => roi("ma")}
                aria-describedby={loiO("ma") ? "goi-y-ma loi-ma" : "goi-y-ma"} aria-invalid={loiO("ma") ? true : undefined} />
              <small id="goi-y-ma">Gợi ý tự tạo theo loại và tên đối tác. Chỉ dùng chữ không dấu, số và gạch ngang.</small>
              {loiO("ma")}
            </div>
            <fieldset className={s.nhom}>
              <legend>Mức giảm</legend>
              <div className={s.hangGiam}>
                <div role="group" aria-label="Kiểu giảm" className={s.kieu}>
                  {[["phanTram", "Theo %"], ["soTien", "Số tiền"]].map(([k, nhan]) => (
                    <button key={k} type="button" aria-pressed={f.kieuGiam === k} onClick={() => dat("kieuGiam", k)}>{nhan}</button>
                  ))}
                </div>
                <label className={s.oDonVi}>{f.kieuGiam === "phanTram" ? "Phần trăm trên tiền công" : "Số tiền giảm trên mỗi đơn"}
                  <span className={loiO("giaTri") ? q.oLoi : undefined}>
                    {f.kieuGiam === "phanTram"
                      ? <input inputMode="numeric" value={f.giaTri} onChange={(e) => dat("giaTri", e.target.value.replace(/\D/g, ""))} onBlur={() => roi("giaTri")} {...aria("giaTri")} />
                      : <OTien value={Number(f.giaTri) || null} onChange={(v) => dat("giaTri", v)} onBlurCapture={() => roi("giaTri")} {...aria("giaTri")} />}
                    <b>{f.kieuGiam === "phanTram" ? "%" : "đ"}</b>
                  </span>
                  {loiO("giaTri")}
                </label>
                {f.kieuGiam === "phanTram" ? (
                  <label className={s.oDonVi}>Giảm tối đa
                    <span>
                      <OTien value={f.giamToiDa === "" ? null : Number(f.giamToiDa)} onChange={(v) => dat("giamToiDa", v)} />
                      <b>đ</b>
                    </span>
                  </label>
                ) : null}
              </div>
            </fieldset>
            <div className={s.ba}>
              <label className={q.truong}>Bắt đầu
                <input className={q.o} type="date" value={f.batDau} onChange={(e) => dat("batDau", e.target.value)} />
              </label>
              <label className={q.truong}>Hạn dùng
                <input className={`${q.o} ${loiO("hetHan") ? q.oLoi : ""}`} type="date" value={f.hetHan} onChange={(e) => dat("hetHan", e.target.value)} onBlur={() => roi("hetHan")} {...aria("hetHan")} />
                {loiO("hetHan")}
              </label>
              <label className={q.truong}>Số lượt tối đa
                <input className={`${q.o} ${loiO("soLuotToiDa") ? q.oLoi : ""}`} inputMode="numeric" placeholder="Không giới hạn" value={f.soLuotToiDa}
                  onChange={(e) => dat("soLuotToiDa", e.target.value.replace(/\D/g, ""))} onBlur={() => roi("soLuotToiDa")} {...aria("soLuotToiDa")} />
                {loiO("soLuotToiDa")}
              </label>
            </div>
            <div className={s.ba}>
              <label className={s.oDonVi}>Hoa hồng cho đối tác
                <span className={loiO("hoaHongPhanTram") ? q.oLoi : undefined}>
                  <input inputMode="decimal" value={f.hoaHongPhanTram} onChange={(e) => dat("hoaHongPhanTram", e.target.value.replace(/[^\d.]/g, ""))}
                    onBlur={() => roi("hoaHongPhanTram")} {...aria("hoaHongPhanTram")} />
                  <b>% doanh thu</b>
                </span>
                {loiO("hoaHongPhanTram")}
              </label>
              <label className={s.tich}>
                <input type="checkbox" checked={f.moiSdtMotLan} onChange={(e) => dat("moiSdtMotLan", e.target.checked)} />
                Mỗi số điện thoại chỉ dùng 1 lần
              </label>
              {f.id ? (
                <label className={s.tich}>
                  <input type="checkbox" checked={f.tamDung} onChange={(e) => dat("tamDung", e.target.checked)} />
                  Tạm dừng mã này
                </label>
              ) : null}
            </div>
            <div className={q.hangNut}>
              <button type="submit" className={`${q.nut} ${q.nutChinh} ${q.nutLon}`} disabled={dangLuu}>
                {dangLuu ? "Đang lưu…" : f.id ? "Lưu thay đổi" : "Tạo mã và QR"}
              </button>
              <button type="button" className={`${q.nut} ${q.nutLon}`} onClick={() => { setF(formTrong()); setLoi({}); setCham({}); }}>
                {f.id ? "Huỷ sửa" : "Nhập lại"}
              </button>
            </div>
          </form>
        ) : null}

        {qr ? (
          <section aria-labelledby="h-qr" className={`${q.the} ${s.qr}`}>
            <div className={s.qrDau}>
              <h2 id="h-qr">Mã QR</h2>
              <span className={q.phu}>Bản in để dán tại quầy, thang máy</span>
            </div>
            <div className={s.theQr} id="the-qr">
              <span className={s.qrThuongHieu}>{tenWeb} · sửa ô tô tận nơi</span>
              <b className={s.qrTieuDe}>Quét mã, thợ tới tận chỗ xe đỗ</b>
              <div className={s.qrAnh}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr.anhQR} width={200} height={200} alt={`Mã QR dẫn tới trang đặt lịch với mã ${qr.ma}`} />
              </div>
              <span className={s.qrUuDai}>{qr.moTaGiam}</span>
              <span className={s.qrMa}>{qr.ma}</span>
              <span className={s.qrPhu}>{qr.doiTac || qr.loaiNhan}{qr.hetHan ? ` · hạn đến ${ngay(qr.hetHan)}` : ""}</span>
            </div>
            <div className={s.link}>
              <span>{qr.linkDatLich}</span>
              <button type="button" onClick={() => chep(qr.linkDatLich)}>Sao chép</button>
            </div>
            <div className={s.haiNut}>
              <a className={`${q.nut} ${q.nutToi} ${q.nutLon}`} href={qr.anhQR} download={`qr-${qr.ma}.png`}><IconQt name="tai-ve" />Tải QR (PNG)</a>
              <button type="button" className={`${q.nut} ${q.nutLon}`} onClick={() => window.print()}><IconQt name="in" />In bản A5</button>
            </div>
            <p className={q.phu}>Khách quét mã sẽ vào trang đặt lịch với mã đã điền sẵn. Đơn tự ghi nguồn <b>{qr.nguonNhan}</b> và mã đối tác để đối soát.</p>
          </section>
        ) : null}
      </div>

      {hoaHong ? (
        <section aria-labelledby="h-hoa-hong" className={`${q.the} ${s.khongTran}`}>
          <div className={s.dauDs}>
            <div className={s.tieuDeHh}>
              <h2 id="h-hoa-hong">Báo cáo hoa hồng theo mã</h2>
              <p className={q.phu}>Chỉ tính đơn đã thanh toán. Đơn huỷ hoặc khách từ chối báo giá không tính.</p>
            </div>
            <nav aria-label="Chọn tháng" className={q.dayVien}>
              {thangs.map((t) => (
                <a key={t} className={q.vien} aria-current={t === thang ? "page" : undefined} href={`/quan-tri/ma-khuyen-mai/?thang=${t}#h-hoa-hong`}>{thangNhan(t)}</a>
              ))}
            </nav>
            <div className={q.hangNut}>
              <a className={`${q.nut} ${q.nutChinh}`} href={`/api/ma-khuyen-mai/hoa-hong?thang=${thang}&dinhDang=xlsx`} download><IconQt name="tai-ve" />Xuất Excel</a>
              <a className={q.nut} href={`/api/ma-khuyen-mai/hoa-hong?thang=${thang}&dinhDang=csv`} download>CSV</a>
            </div>
          </div>
          <div className={q.cuonNgang}>
            <table className={`${q.bang} ${s.bangHh}`}>
              <thead>
                <tr>
                  <th scope="col">Mã · đối tác</th>
                  <th scope="col">Loại</th>
                  <th scope="col" className={q.so}>Số đơn</th>
                  <th scope="col" className={q.so}>Doanh thu sau giảm</th>
                  <th scope="col" className={q.so}>Tỷ lệ hoa hồng</th>
                  <th scope="col" className={q.so}>Hoa hồng phải trả</th>
                </tr>
              </thead>
              <tbody>
                {hoaHong.dong.map((d) => (
                  <tr key={d.ma}>
                    <td><span className={q.ma}>{d.ma}</span><div className={s.doiTac}>{d.doiTac || "—"}</div></td>
                    <td>{d.loai}</td>
                    <td className={q.so}>{d.soDon}</td>
                    <td className={q.so}>{d.doanhThuHienThi}</td>
                    <td className={q.so}>{d.tyLe ? `${d.tyLe}%` : "Không áp dụng"}</td>
                    <td className={`${q.so} ${s.hh}`}>{d.hoaHongHienThi}</td>
                  </tr>
                ))}
                {!hoaHong.dong.length ? <tr><td colSpan={6}><p className={q.rong}>Tháng này chưa có đơn đã thanh toán dùng mã.</p></td></tr> : null}
                <tr className={q.dongTong}>
                  <td colSpan={2}>Tổng {thangNhan(hoaHong.thang)}</td>
                  <td className={q.so}>{hoaHong.tong.soDon}</td>
                  <td className={q.so}>{hoaHong.tong.doanhThuHienThi}</td>
                  <td />
                  <td className={`${q.so} ${s.tongHh}`}>{hoaHong.tong.hoaHongHienThi}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className={q.chan}>File xuất có thêm danh sách mã đơn (TT-…) để đối tác tự kiểm tra.</div>
        </section>
      ) : (
        <div className={`${q.thongBao} ${q.tbTin}`} role="note"><span>Báo cáo hoa hồng do Marketing và Quản trị xem.</span></div>
      )}
    </>
  );
}
