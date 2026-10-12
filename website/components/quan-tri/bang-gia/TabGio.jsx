"use client";
// Tab "Giờ nhận đơn & ngày nghỉ": khung 2 giờ theo ngày trong tuần, số đơn tối đa mỗi khung, giờ nhận gọi gấp,
// lịch ngày nghỉ. Lưu một lần qua POST /api/globals/lich-nhan-don.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ThongBao from "../ThongBao";
import IconQt from "../IconQt";
import { goiApi } from "../api";
import q from "../qt.module.css";
import s from "./BangGia.module.css";

const THU = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
/** ISO (UTC) → "YYYY-MM-DD" theo giờ Việt Nam */
const ngayVN = (iso) => new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(0, 10);
const isoTuNgay = (d) => new Date(`${d}T00:00:00+07:00`).toISOString();
const homNay = () => ngayVN(new Date().toISOString());
const congNgay = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400e3).toISOString().slice(0, 10);
const dmy = (d) => d.split("-").reverse().join("/");
const gioNgan = (g) => String(g || "").replace(/:00$/, "").replace(/^0/, "");

export default function TabGio({ lich, coTheSua }) {
  const router = useRouter();
  const goc = useMemo(() => ({
    khung: (lich.khungGio || []).map((k) => ({ ...k, ngayTrongTuan: [...(k.ngayTrongTuan || [])] })),
    gap: { tu: lich.gioNhanGap?.tu || "", den: lich.gioNhanGap?.den || "" },
    nghi: (lich.ngayNghi || []).map((n) => ({ ngay: ngayVN(n.ngay), ten: n.ten || "" })).sort((a, b) => a.ngay.localeCompare(b.ngay)),
  }), [lich]);
  const [khung, setKhung] = useState(goc.khung);
  const [gap, setGap] = useState(goc.gap);
  const [nghi, setNghi] = useState(goc.nghi);
  const [thang, setThang] = useState(() => homNay().slice(0, 7));
  const [dot, setDot] = useState(null); // form thêm đợt nghỉ
  const [tb, setTb] = useState(null);
  const [dangLuu, setDangLuu] = useState(false);

  const doi = JSON.stringify({ khung, gap, nghi }) !== JSON.stringify(goc);
  const soDonChung = khung.length && khung.every((k) => k.soDonToiDa === khung[0].soDonToiDa) ? khung[0].soDonToiDa : "";
  const nghiSet = new Set(nghi.map((n) => n.ngay));

  const batTatKhung = (i, thu) => {
    setTb(null);
    setKhung((ds) => ds.map((k, j) => (j !== i ? k : {
      ...k, ngayTrongTuan: k.ngayTrongTuan.includes(thu) ? k.ngayTrongTuan.filter((t) => t !== thu) : THU.filter((t) => t === thu || k.ngayTrongTuan.includes(t)),
    })));
  };
  const batTatNgay = (d) => {
    setTb(null);
    setNghi((ds) => (ds.some((n) => n.ngay === d) ? ds.filter((n) => n.ngay !== d) : [...ds, { ngay: d, ten: "" }].sort((a, b) => a.ngay.localeCompare(b.ngay))));
  };

  // Lưới tháng (tuần bắt đầu thứ Hai)
  const [nam, thg] = thang.split("-").map(Number);
  const dau = `${thang}-01`;
  const soNgay = new Date(Date.UTC(nam, thg, 0)).getUTCDate();
  const lech = (new Date(`${dau}T00:00:00Z`).getUTCDay() + 6) % 7;
  const hn = homNay();
  const doiThang = (n) => {
    const d = new Date(Date.UTC(nam, thg - 1 + n, 1));
    setThang(d.toISOString().slice(0, 7));
  };

  // Đợt nghỉ sắp tới: gộp các ngày liền nhau cùng lý do
  const sapToi = [];
  for (const n of nghi.filter((x) => x.ngay >= hn)) {
    const cuoi = sapToi[sapToi.length - 1];
    if (cuoi && cuoi.ten === n.ten && congNgay(cuoi.den, 1) === n.ngay) cuoi.den = n.ngay;
    else sapToi.push({ tu: n.ngay, den: n.ngay, ten: n.ten });
  }

  const themDot = () => {
    if (!dot?.tu) {
      setTb({ loai: "loi", chu: "Chọn ngày bắt đầu đợt nghỉ." });
      return;
    }
    const den = dot.den && dot.den >= dot.tu ? dot.den : dot.tu;
    const moi = [];
    for (let d = dot.tu; d <= den && moi.length < 60; d = congNgay(d, 1)) moi.push({ ngay: d, ten: dot.ten?.trim() || "" });
    setNghi((ds) => [...ds.filter((n) => !moi.some((m) => m.ngay === n.ngay)), ...moi].sort((a, b) => a.ngay.localeCompare(b.ngay)));
    setThang(dot.tu.slice(0, 7));
    setDot(null);
  };

  async function luu() {
    if (!doi || dangLuu) return;
    if (khung.some((k) => !k.ngayTrongTuan.length)) {
      setTb({ loai: "loi", chu: "Mỗi khung giờ cần mở ít nhất một ngày. Khung không dùng nữa thì xoá trong CMS." });
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(gap.tu) || !/^\d{2}:\d{2}$/.test(gap.den)) {
      setTb({ loai: "loi", chu: "Giờ nhận gọi gấp ghi dạng 06:00 – 22:00." });
      return;
    }
    setDangLuu(true);
    setTb(null);
    try {
      await goiApi("/api/globals/lich-nhan-don", {
        method: "POST",
        body: {
          gioNhanGap: gap,
          khungGio: khung.map(({ id, ma, batDau, ketThuc, soDonToiDa, ngayTrongTuan }) => ({ id, ma, batDau, ketThuc, soDonToiDa, ngayTrongTuan })),
          ngayNghi: nghi.map((n) => ({ ngay: isoTuNgay(n.ngay), ten: n.ten || null })),
        },
      });
      setTb({ loai: "ok", chu: "Đã lưu giờ nhận đơn và ngày nghỉ. Form đặt lịch dùng lịch mới ngay." });
      router.refresh();
    } catch (e) {
      setTb({ loai: "loi", chu: e.message });
    } finally {
      setDangLuu(false);
    }
  }

  return (
    <>
      <ThongBao tb={tb} onDong={() => setTb(null)} />
      <section aria-label="Giờ nhận đơn và ngày nghỉ" className={s.haiCot}>
        <div className={`${q.the} ${q.theDem}`}>
          <div>
            <h2 id="h-gio">Khung giờ nhận đơn</h2>
            <span className={q.phu}>Khung giờ khách chọn ở bước chọn ngày giờ khi đặt lịch. Bấm từng ô để mở hoặc đóng.</span>
          </div>
          <div className={q.cuonNgang}>
            <div role="table" aria-labelledby="h-gio" className={s.luoiGio} style={{ "--so-khung": khung.length }}>
              <div role="row" className={s.hangGio}>
                <span role="columnheader">Ngày</span>
                {khung.map((k) => <span key={k.id || k.ma} role="columnheader">{gioNgan(k.batDau)}–{gioNgan(k.ketThuc)}</span>)}
              </div>
              {THU.map((thu) => (
                <div role="row" key={thu} className={s.hangGio}>
                  <b role="rowheader">{thu}</b>
                  {khung.map((k, i) => {
                    const mo = k.ngayTrongTuan.includes(thu);
                    return (
                      <span role="cell" key={k.id || k.ma}>
                        <button type="button" aria-pressed={mo} className={s.oGio} disabled={!coTheSua}
                          aria-label={`${thu} ${k.batDau}–${k.ketThuc} ${mo ? "đang nhận đơn" : "nghỉ"}`} onClick={() => batTatKhung(i, thu)}>
                          {mo ? "Nhận" : "Nghỉ"}
                        </button>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className={q.luoi}>
            <label className={q.truong}>Số đơn tối đa mỗi khung
              <input className={q.o} inputMode="numeric" readOnly={!coTheSua} value={soDonChung} placeholder="Mỗi khung một số (sửa trong CMS)"
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/\D/g, ""));
                  if (e.target.value === "" || Number.isFinite(n)) setKhung((ds) => ds.map((k) => ({ ...k, soDonToiDa: n })));
                }} />
            </label>
            <fieldset className={s.gioGap}>
              <legend>Gọi thợ gấp, cứu hộ (hằng ngày)</legend>
              <input className={q.o} aria-label="Nhận gọi gấp từ (giờ:phút)" inputMode="numeric" placeholder="06:00" maxLength={5} value={gap.tu} readOnly={!coTheSua}
                onChange={(e) => setGap({ ...gap, tu: e.target.value })} />
              <span aria-hidden="true">–</span>
              <input className={q.o} aria-label="Nhận gọi gấp đến (giờ:phút)" inputMode="numeric" placeholder="22:00" maxLength={5} value={gap.den} readOnly={!coTheSua}
                onChange={(e) => setGap({ ...gap, den: e.target.value })} />
            </fieldset>
          </div>
        </div>

        <div className={`${q.the} ${q.theDem}`}>
          <div>
            <h2>Ngày nghỉ</h2>
            <span className={q.phu}>Ngày nghỉ không cho đặt lịch. Bấm vào ngày để đánh dấu nghỉ hoặc mở lại.</span>
          </div>
          <div className={s.thang}>
            <button type="button" className={s.nutThang} aria-label="Tháng trước" onClick={() => doiThang(-1)}><IconQt name="truoc" /></button>
            <b aria-live="polite">Tháng {thg} năm {nam}</b>
            <button type="button" className={s.nutThang} aria-label="Tháng sau" onClick={() => doiThang(1)}><IconQt name="sau" /></button>
          </div>
          <div className={s.lich}>
            {THU.map((t) => <span key={t} className={s.thu} aria-hidden="true">{t}</span>)}
            {Array.from({ length: lech }, (_, i) => <span key={`r${i}`} />)}
            {Array.from({ length: soNgay }, (_, i) => {
              const d = `${thang}-${String(i + 1).padStart(2, "0")}`;
              const off = nghiSet.has(d);
              const cn = (lech + i) % 7 === 6;
              const qua = d < hn;
              return (
                <button key={d} type="button" aria-pressed={off} disabled={!coTheSua || qua}
                  aria-label={`${dmy(d)} ${off ? "nghỉ" : "nhận đơn"}`}
                  className={`${s.ngay} ${cn ? s.ngayCN : ""} ${qua ? s.ngayQua : ""}`} onClick={() => batTatNgay(d)}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className={s.chuGiai}>
            <span><span className={`${s.oMau} ${s.oMauNghi}`} />Nghỉ</span>
            <span><span className={s.oMau} />Nhận đơn</span>
          </div>
          <div className={s.sapToi}>
            <b>Sắp tới</b>
            {sapToi.slice(0, 8).map((d) => (
              <div key={d.tu} className={s.dotNghi}>
                <span>{d.ten || "Ngày nghỉ"}</span>
                <b>{d.tu === d.den ? dmy(d.tu) : `${dmy(d.tu).slice(0, 5)} – ${dmy(d.den)}`}</b>
              </div>
            ))}
            {!sapToi.length ? <span className={q.phu}>Chưa có ngày nghỉ nào sắp tới.</span> : null}
            {coTheSua && !dot ? (
              <button type="button" className={`${q.nut} ${q.nutNho} ${s.nutThem}`} onClick={() => setDot({ tu: "", den: "", ten: "" })}>
                <IconQt name="them" /> Thêm đợt nghỉ
              </button>
            ) : null}
            {dot ? (
              <div className={s.themDot}>
                <label className={q.truong}>Từ ngày<input className={q.o} type="date" min={hn} value={dot.tu} onChange={(e) => setDot({ ...dot, tu: e.target.value })} /></label>
                <label className={q.truong}>Đến ngày<input className={q.o} type="date" min={dot.tu || hn} value={dot.den} onChange={(e) => setDot({ ...dot, den: e.target.value })} /></label>
                <label className={q.truong}>Lý do<input className={q.o} value={dot.ten} placeholder="Tết Nguyên đán" onChange={(e) => setDot({ ...dot, ten: e.target.value })} /></label>
                <div className={q.hangNut}>
                  <button type="button" className={`${q.nut} ${q.nutNho}`} onClick={() => setDot(null)}>Huỷ</button>
                  <button type="button" className={`${q.nut} ${q.nutNho} ${q.nutToi}`} onClick={themDot}>Thêm vào lịch</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      {coTheSua ? (
        <div className={`${q.the} ${q.thanhLuu}`}>
          <span>{doi ? "Có thay đổi giờ nhận đơn hoặc ngày nghỉ chưa lưu." : "Không có thay đổi chưa lưu."}</span>
          <button type="button" className={`${q.nut} ${q.nutLon}`} disabled={!doi || dangLuu}
            onClick={() => { setKhung(goc.khung); setGap(goc.gap); setNghi(goc.nghi); }}>Bỏ thay đổi</button>
          <button type="button" className={`${q.nut} ${q.nutLon} ${doi ? q.nutChinh : q.nutTat}`} disabled={!doi || dangLuu} onClick={luu}>
            {dangLuu ? "Đang lưu…" : doi ? "Lưu giờ nhận đơn & ngày nghỉ" : "Đã lưu hết"}
          </button>
        </div>
      ) : null}
    </>
  );
}
