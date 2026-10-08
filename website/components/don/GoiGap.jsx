"use client";
// Form gọi thợ gấp (thiết kế GoiGap): 1. sự cố → 2. vị trí (trình duyệt hoặc gõ tay, kiểm tra vùng) → 3. số điện thoại + đồng ý.
// Gửi POST /api/don-hang/goi-gap; thành công hiện màn xác nhận kèm nút theo dõi đơn. API: docs/api.md mục 4.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TruongNhap, oNhap, ODongY, OBay } from "../chung/Form";
import { chuanHoaSdt } from "../../lib/so-dien-thoai.mjs";
import { ghiSuKien, layNguon } from "../../lib/su-kien-client";
import Icon from "../Icon";
import DauKhanCap from "./DauKhanCap";
import { TheChon } from "./NutChon";
import OViTri from "./OViTri";
import useViTri from "./useViTri";
import { goiApi, telHref } from "./goi-api";
import s from "./GoiGap.module.css";

// Biểu tượng theo mã sự cố (cấu hình chung → Gọi gấp); mã lạ thì theo dịch vụ gắn kèm.
const ICON_SU_CO = { aq: "battery", lop: "tire", may: "nguon-dien", khac: "hoi" };
const ICON_DICH_VU = { "ac-quy": "battery", lop: "tire", phanh: "brake", "cuu-ho-keo-xe": "tow", "doc-loi-chan-doan": "engine", "bao-duong-dinh-ky": "oil" };
const iconSuCo = (sc) => ICON_SU_CO[sc.ma] || ICON_DICH_VU[sc.dichVu] || "wrench";

const LOI_SDT = "Số điện thoại chưa đúng (10 số, bắt đầu bằng 03, 05, 07, 08, 09).";
const ID_TRUONG = { suCo: "nhom-su-co", "khach.sdt": "sdt-gap", dongY: "dongY-gap", "viTri.diaChi": "dia-chi-gap", "viTri.toaDo": "dia-chi-gap" };

const gioPhut = (iso) => {
  try { return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }); } catch { return ""; }
};

export default function GoiGap({ duLieu, thuongHieu, linkKeoXe, khongJs = null }) {
  const { suCo: dsSuCo, camKet, vungPhucVu, gioNhanGap, lienHe } = duLieu;
  const hotline = lienHe?.hotline;
  const phut = camKet?.cuuHoPhut;
  const khuVuc = (vungPhucVu?.quan || []).map((q) => q.ten);

  const [suCo, setSuCo] = useState("");
  const [moTa, setMoTa] = useState("");
  const vt = useViTri();
  const [sdt, setSdt] = useState("");
  const [dongY, setDongY] = useState(false);
  const [website, setWebsite] = useState("");
  const [loi, setLoi] = useState({});
  const [loiChung, setLoiChung] = useState("");
  const [ngoaiGio, setNgoaiGio] = useState(gioNhanGap && !gioNhanGap.dangNhan ? `Ngoài giờ nhận đơn gấp (${gioNhanGap.tu}–${gioNhanGap.den}). Gọi hotline để được hỗ trợ.` : "");
  const [dangGui, setDangGui] = useState(false);
  const [ketQua, setKetQua] = useState(null);
  const tieuDeXong = useRef(null);

  useEffect(() => {
    if (!ketQua) return;
    window.scrollTo({ top: 0 });
    tieuDeXong.current?.focus({ preventScroll: true });
  }, [ketQua]);

  const datLoi = (k, v) => setLoi((l) => { const m = { ...l }; if (v) m[k] = v; else delete m[k]; return m; });
  const suCoChon = dsSuCo.find((x) => x.ma === suCo);
  const ngoaiVung = Boolean(vt.ketQua && !vt.ketQua.trongVung);
  const viTriOk = vt.ketQua?.trongVung || (vt.coViTri && !ngoaiVung && (vt.banDoLoi || (!vt.toaDo && !vt.ketQua && !vt.loi)));
  const sanSang = Boolean(suCo && viTriOk && !ngoaiGio);

  let ghiChuChan = "Đơn gửi đi gắn nhãn KHẨN CẤP, điều phối nhận chuông báo ngay.";
  if (!vt.coViTri) ghiChuChan = "Bấm \"Lấy vị trí của xe\" để gửi được yêu cầu.";
  if (ngoaiVung) ghiChuChan = "Vị trí ngoài vùng phục vụ: gọi tư vấn hoặc đặt kéo xe.";
  if (ngoaiGio) ghiChuChan = "Ngoài giờ nhận đơn gấp: gọi hotline để được hỗ trợ.";

  const veO = (k) => requestAnimationFrame(() => document.getElementById(ID_TRUONG[k] || "")?.focus());

  async function gui() {
    if (dangGui) return;
    setLoiChung("");
    const l = {};
    if (!suCo) l.suCo = "Chọn xe đang bị gì.";
    if (!vt.coViTri) l["viTri.diaChi"] = "Cho biết vị trí xe: bấm lấy vị trí hoặc gõ địa chỉ.";
    else if (vt.toaDo && vt.dangKiem) l["viTri.diaChi"] = "Đang kiểm tra vị trí, chờ một chút rồi bấm lại.";
    else {
      const kt = vt.ketQua ? { ok: true, ketQua: vt.ketQua } : await vt.kiemDiaChi();
      if (kt?.ok && !kt.ketQua.trongVung) l["viTri.diaChi"] = "Vị trí này ngoài vùng phục vụ.";
      else if (kt && !kt.ok && !kt.banDoLoi && !kt.cu) l["viTri.diaChi"] = kt.loi || "Chưa tìm được địa chỉ này, gõ rõ hơn.";
    }
    if (!chuanHoaSdt(sdt)) l["khach.sdt"] = LOI_SDT;
    if (!dongY) l.dongY = "Bạn tích ô đồng ý giúp mình để gửi yêu cầu nhé.";
    setLoi(l);
    const dau = Object.keys(l)[0];
    if (dau) { veO(dau); return; }
    if (ngoaiGio) return;

    setDangGui(true);
    const r = await goiApi("/api/don-hang/goi-gap", {
      body: { suCo, moTaSuCo: moTa.trim(), viTri: vt.giaTriGui(), khach: { sdt }, dongY: true, nguon: layNguon(), website },
    });
    setDangGui(false);
    if (r.ok) {
      setKetQua(r.data);
      ghiSuKien("guiForm");
      return;
    }
    const d = r.data;
    if (d.ma === "NGOAI_GIO_NHAN_GAP") { setNgoaiGio(d.loi); return; }
    const truong = { ...(d.truong || {}) };
    if (d.ma === "NGOAI_VUNG") { vt.setKetQua(d.vung || null); truong["viTri.diaChi"] = "Vị trí này ngoài vùng phục vụ."; }
    if (d.ma === "KHONG_TIM_THAY_DIA_CHI" || d.ma === "THIEU_VI_TRI") truong["viTri.diaChi"] = d.loi;
    if (d.ma === "SU_CO_KHONG_CO" && !truong.suCo) truong.suCo = d.loi;
    if (Object.keys(truong).length) { setLoi(truong); veO(Object.keys(truong)[0]); if (d.ma === "DU_LIEU_SAI") setLoiChung(d.loi); }
    else setLoiChung(d.loi || "Chưa gửi được, gọi hotline giúp mình nhé.");
  }

  if (ketQua) {
    return (
      <>
        <DauKhanCap phu={thuongHieu} hotline={hotline} />
        <XacNhanGap kq={ketQua} sdt={sdt} suCo={suCoChon} moTa={moTa} diaChi={vt.ketQua?.viTri?.diaChi || vt.diaChi} phut={phut} hotline={hotline} tieuDeRef={tieuDeXong} />
      </>
    );
  }

  return (
    <>
      <DauKhanCap phu={thuongHieu} hotline={hotline} tieuDeLaH1 />
      {khongJs ? <div>{khongJs}</div> : null}
      <div className={s.noiDung}>
        {ngoaiGio ? (
          <div className={s.ngoaiGio} role="alert">
            <b>{ngoaiGio}</b>
            <a className="nut nut-chinh" href={telHref(hotline)}><Icon name="phone" />Gọi {hotline}</a>
          </div>
        ) : (
          <div className={s.camKet}>
            <Icon name="dong-ho" size={26} className={s.camKetIcon} />
            <span>
              {phut ? <b className={s.dam}>Thợ có mặt trong {phut} phút</b> : <b className={s.dam}>Thợ tới nhanh nhất</b>}
              {khuVuc.length ? ` ở ${khuVuc.join(", ")}` : ""}. Chỉ cần 3 thông tin bên dưới.
            </span>
          </div>
        )}

        <section className={s.muc} aria-labelledby="muc-su-co">
          <h2 id="muc-su-co" className={s.h2}>1. Xe đang bị gì?</h2>
          <div id="nhom-su-co" tabIndex={-1} className={s.luoi} role="group" aria-labelledby="muc-su-co" aria-describedby={loi.suCo ? "suCo-loi" : undefined}>
            {dsSuCo.map((sc) => (
              <TheChon key={sc.ma} chon={suCo === sc.ma} cao={112} onClick={() => { setSuCo(sc.ma); datLoi("suCo", ""); }}
                icon={<Icon name={iconSuCo(sc)} size={30} />} ten={sc.ten} moTa={sc.moTa} data-su-co={sc.ma} />
            ))}
          </div>
          {loi.suCo ? <span id="suCo-loi" className={s.loi} role="alert">{loi.suCo}</span> : null}
          {suCo === "khac" ? (
            <TruongNhap id="mo-ta-su-co" nhan="Tả ngắn giúp thợ mang đúng đồ">
              <input {...oNhap("mo-ta-su-co")} type="text" maxLength={1000} placeholder="VD: đèn check engine sáng, xe giật" value={moTa} onChange={(e) => setMoTa(e.target.value)} />
            </TruongNhap>
          ) : null}
        </section>

        <section className={s.muc} aria-labelledby="muc-vi-tri">
          <h2 id="muc-vi-tri" className={s.h2}>2. Xe đang ở đâu?</h2>
          <OViTri vt={vt} id="dia-chi-gap" khanCap ketQuaTruocO nhanNut="Lấy vị trí của xe" nhanO="Hoặc gõ địa chỉ, mốc gần nhất"
            goiY="VD: trước số 72 Nguyễn Chí Thanh" loi={ngoaiVung ? undefined : loi["viTri.diaChi"]} hotline={hotline} linkKeoXe={linkKeoXe} />
        </section>

        <section className={s.muc} aria-labelledby="muc-sdt">
          <h2 id="muc-sdt" className={s.h2}>3. Số điện thoại của bạn</h2>
          <TruongNhap id="sdt-gap" nhan="Số điện thoại" loi={loi["khach.sdt"]} goiY="Điều phối và thợ sẽ gọi số này. Tin xác nhận gửi vào Zalo của số này." className={s.sdt}>
            <input {...oNhap("sdt-gap", loi["khach.sdt"], "x")} type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder="09xx xxx xxx"
              value={sdt} onChange={(e) => { setSdt(e.target.value); if (chuanHoaSdt(e.target.value)) datLoi("khach.sdt", ""); }}
              onBlur={() => { if (sdt && !chuanHoaSdt(sdt)) datLoi("khach.sdt", LOI_SDT); }} />
          </TruongNhap>
          <ODongY id="dongY-gap" checked={dongY} onChange={(e) => { setDongY(e.target.checked); if (e.target.checked) datLoi("dongY", ""); }}
            noiDung="Tôi đồng ý cho xử lý số điện thoại và vị trí để phục vụ yêu cầu này" linkChinhSach={lienHe?.chinhSachDuLieu || "/chinh-sach-du-lieu/"} loi={loi.dongY} />
          <OBay value={website} onChange={(e) => setWebsite(e.target.value)} />
        </section>
      </div>

      <footer className={s.chan}>
        <span className={s.ghiChuChan}><span className={s.chamDo} aria-hidden="true" />{ghiChuChan}</span>
        {loiChung ? <p className="bao bao-loi" role="alert">{loiChung} {hotline ? <a href={telHref(hotline)}>Gọi {hotline}</a> : null}</p> : null}
        <button type="button" className={`${s.nutGui} ${sanSang ? "" : s.nutTat}`} onClick={gui} disabled={dangGui} aria-disabled={sanSang ? undefined : "true"}>
          <Icon name="gui-di" size={20} />
          {dangGui ? "Đang gửi…" : "Gửi yêu cầu khẩn cấp"}
        </button>
      </footer>
    </>
  );
}

function XacNhanGap({ kq, sdt, suCo, moTa, diaChi, phut, hotline, tieuDeRef }) {
  let link = kq.linkTheoDoi;
  try { link = new URL(kq.linkTheoDoi).pathname; } catch { /* giữ nguyên */ }
  const luc = gioPhut(kq.nhanLuc);
  const khuVuc = [kq.viTri?.phuong, kq.viTri?.quan].filter(Boolean).join(", ");
  return (
    <div className={s.xong}>
      <div className={s.xongDau}>
        <span className={s.dauTich}><Icon name="check" size={36} /></span>
        <span className={s.nhanDon}>ĐƠN KHẨN CẤP · <span data-ma-don>{kq.ma}</span></span>
        <h1 ref={tieuDeRef} tabIndex={-1} className={s.h1}>Đã nhận. Điều phối đang xếp thợ gần nhất</h1>
        <p className={s.phu}>Đơn của bạn được đưa lên đầu hàng chờ. Điều phối sẽ gọi lại số {sdt} ngay khi xếp được thợ.</p>
      </div>
      {phut ? (
        <div className={s.theToi}>
          <div className={s.soPhut}><b>{phut}</b><span>phút</span></div>
          <span>Cam kết thợ có mặt trong {phut} phút{luc ? ` kể từ ${luc}` : ""}. Muộn hơn, chúng tôi gọi báo bạn trước.</span>
        </div>
      ) : null}
      <ol className={s.cacBuoc}>
        <li><span className={s.buocXong}><Icon name="check" size={14} /></span><span><b>Đã nhận yêu cầu</b>{luc ? ` · ${luc}` : ""}</span></li>
        <li><span className={s.buocDang} aria-hidden="true" /><span><b className={s.chuNhan}>Đang xếp thợ gần nhất</b></span></li>
        <li className={s.buocCho}><span className={s.buocChua} aria-hidden="true" /><span>Thợ đang đến · link theo dõi gửi qua Zalo</span></li>
      </ol>
      <dl className={s.tomTat}>
        {suCo ? <div><dt>Vấn đề</dt><dd>{suCo.ten}{moTa.trim() ? ` (${moTa.trim()})` : ""}</dd></div> : null}
        {diaChi || khuVuc ? <div><dt>Vị trí</dt><dd>{diaChi || khuVuc}</dd></div> : null}
        <div><dt>Điện thoại</dt><dd>{sdt}</dd></div>
      </dl>
      <div className={s.loiKhuyen}>
        <b className={s.dam}>Trong lúc chờ:</b> bật đèn khẩn cấp, đặt xe ở chỗ an toàn và đứng lên vỉa hè. Đừng cố đề máy liên tục.
      </div>
      {hotline ? <a className="nut nut-chinh nut-lon nut-day" href={telHref(hotline)}><Icon name="phone" />Gọi ngay {hotline}</a> : null}
      <a className={`nut nut-toi nut-day ${s.nutTheoDoi}`} href={link}>Theo dõi đơn</a>
      <Link href="/" className={s.linkPhu}>Về trang chủ</Link>
    </div>
  );
}
