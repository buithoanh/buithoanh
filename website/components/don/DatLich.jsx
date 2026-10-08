"use client";
// Form đặt lịch 4 bước (thiết kế DatLich): 1. việc cần làm → 2. xe → 3. vị trí → 4. giờ + liên hệ → màn xác nhận.
// Dữ liệu ban đầu do trang server dựng sẵn (layTrangDatLich). Mọi dữ liệu đã nhập giữ trong state của component này
// (đổi bước, gửi lỗi đều không mất). API: docs/api.md mục 2–4, 7 (mã khuyến mãi).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { TruongNhap, oNhap, ODongY, OTich, OBay } from "../chung/Form";
import ChonXe from "../chung/ChonXe";
import { chuanHoaBienSo } from "../../lib/bien-so.mjs";
import { chuanHoaSdt } from "../../lib/so-dien-thoai.mjs";
import { ghiSuKien, layMaTuLink, layNguon } from "../../lib/su-kien-client";
import Icon from "../Icon";
import DauLuong from "./DauLuong";
import ChonDichVu from "./ChonDichVu";
import ChonNgayGio, { datDuoc } from "./ChonNgayGio";
import NutChon from "./NutChon";
import OViTri from "./OViTri";
import FooterGia from "./FooterGia";
import TepDinhKem from "./TepDinhKem";
import useViTri from "./useViTri";
import { goiApi, telHref } from "./goi-api";
import s from "./LuongDon.module.css";

const TIEU_DE = { 1: "Xe cần làm gì?", 2: "Xe của bạn", 3: "Xe đang ở đâu?", 4: "Chọn giờ và để lại số" };

/** Ô lỗi của API → bước chứa ô đó. */
function buocCuaTruong(k) {
  if (k === "dichVu" || k === "trieuChung" || k === "tep") return 1;
  if (k.startsWith("xe.")) return 2;
  if (k.startsWith("viTri.")) return 3;
  return 4;
}

/** Ô lỗi → id phần tử để đưa con trỏ tới. */
const ID_TRUONG = {
  dichVu: "nhom-dich-vu", tep: "tep-nut", "xe.hang": "xe-hang", "xe.dong": "xe-dong", "xe.doi": "xe-doi", "xe.bienSo": "bien-so", "xe.soKm": "so-km",
  "viTri.diaChi": "dia-chi", "viTri.toaDo": "dia-chi", "viTri.choDo": "nhom-cho-do", "viTri.ghiChuChoTho": "ghi-chu-tho",
  khungGio: "nhom-khung-gio", "khach.hoTen": "ho-ten", "khach.sdt": "sdt", "hoaDon.mst": "mst", "hoaDon.email": "mst", ma: "ma-gt", dongY: "dongY",
};

const ngayDauCoCho = (lich) => (lich.find((n) => !n.nghi && n.khung.some(datDuoc)) || lich[0])?.ngay || "";

export default function DatLich({ duLieu, dvChon = [], maLink = "", giaDau = null, khongJs = null }) {
  const { dichVu: dsDichVu, hangXe, choDo: dsChoDo, phi, lienHe, gioiHanTep } = duLieu;
  const hotline = lienHe?.hotline;

  const [buoc, setBuoc] = useState(1);
  const [ketQua, setKetQua] = useState(null);
  // Bước 1
  const [dichVu, setDichVu] = useState(dvChon);
  const [trieuChung, setTrieuChung] = useState("");
  const [tep, setTep] = useState([]);
  // Bước 2
  const [xe, setXe] = useState({ hang: "", dong: "", doi: null });
  const [bienSo, setBienSo] = useState("");
  const [soKm, setSoKm] = useState("");
  // Bước 3
  const vt = useViTri();
  const [choDo, setChoDo] = useState("");
  const [ghiChuTho, setGhiChuTho] = useState("");
  // Bước 4
  const [lich, setLich] = useState(duLieu.lich || []);
  const [ngay, setNgay] = useState(() => ngayDauCoCho(duLieu.lich || []));
  const [khung, setKhung] = useState("");
  const [dangTaiLich, setDangTaiLich] = useState(false);
  const [hoTen, setHoTen] = useState("");
  const [sdt, setSdt] = useState("");
  const [moThem, setMoThem] = useState(Boolean(maLink));
  const [mst, setMst] = useState("");
  const [tenCongTy, setTenCongTy] = useState("");
  const [diaChiCongTy, setDiaChiCongTy] = useState("");
  const [traMst, setTraMst] = useState("");
  const [ma, setMa] = useState(maLink);
  const [maKq, setMaKq] = useState(null); // { ma, sdt, hopLe, loai, moTa | lyDo }
  const [dangKiemMa, setDangKiemMa] = useState(false);
  const [dongY, setDongY] = useState(false);
  const [nhacBaoDuong, setNhacBaoDuong] = useState(false);
  const [website, setWebsite] = useState("");
  // Chung
  const [loi, setLoi] = useState({});
  const [loiChung, setLoiChung] = useState("");
  const [gia, setGia] = useState(giaDau);
  const [dangTinh, setDangTinh] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const tieuDeRef = useRef(null);
  const daVao = useRef(false);

  const datLoi = useCallback((k, v) => setLoi((l) => {
    if (!v && !l[k]) return l;
    const m = { ...l };
    if (v) m[k] = v; else delete m[k];
    return m;
  }), []);

  // Mã từ link ?ma= đã lưu trong phiên (vào trang khác trước rồi mới tới form)
  useEffect(() => {
    if (ma) return;
    const m = layMaTuLink() || layNguon().ma || "";
    if (m) { setMa(m); setMoThem(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Giá sơ bộ theo dịch vụ + dòng xe
  useEffect(() => {
    if (!daVao.current && giaDau && !xe.dong) { daVao.current = true; return; }
    daVao.current = true;
    const huy = new AbortController();
    const hen = setTimeout(async () => {
      setDangTinh(true);
      const r = await goiApi("/api/bao-gia-so-bo", { body: { dichVu, ...(xe.dong ? { dongXe: xe.dong } : {}) }, signal: huy.signal });
      if (r.status === -1) return;
      setDangTinh(false);
      if (r.ok) setGia(r.data);
      else setGia((g) => ({ ...(g || {}), trangThai: "loi", hienThi: g?.hienThi || "—", ghiChu: "Chưa tính được giá lúc này. Thợ sẽ báo giá trước khi làm." }));
    }, 250);
    return () => { clearTimeout(hen); huy.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dichVu.join(","), xe.dong]);

  // Vào bước 4: tải lại khung giờ (không cache), bỏ khung đã chọn nếu vừa đầy
  const taiLich = useCallback(async () => {
    setDangTaiLich(true);
    const r = await goiApi(`/api/lich-dat/khung-gio?soNgay=${Math.max(1, (duLieu.lich || []).length || 4)}`, { method: "GET" });
    setDangTaiLich(false);
    if (!r.ok || !Array.isArray(r.data.ngay)) return;
    const moi = r.data.ngay;
    setLich(moi);
    setNgay((n) => {
      const d = moi.find((x) => x.ngay === n);
      return d && !d.nghi && d.khung.some(datDuoc) ? n : ngayDauCoCho(moi);
    });
    setKhung((k) => {
      const d = moi.find((x) => x.ngay === ngay);
      return d && !d.nghi && datDuoc(d.khung.find((x) => x.ma === k)) ? k : "";
    });
  }, [duLieu.lich, ngay]);

  useEffect(() => {
    if (buoc === 4) taiLich();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buoc]);

  // Đổi bước: lên đầu trang, đưa con trỏ vào tiêu đề (đọc màn hình biết đã sang bước mới)
  const doiBuoc = useCallback((b, oLoi) => {
    setBuoc(b);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      const el = oLoi && document.getElementById(ID_TRUONG[oLoi] || "");
      if (el) { el.focus({ preventScroll: false }); el.scrollIntoView?.({ block: "center" }); }
      else tieuDeRef.current?.focus({ preventScroll: true });
    });
  }, []);

  // ---------- Kiểm tra từng bước ----------
  function kiemBuoc1() {
    const l = {};
    if (!dichVu.length) l.dichVu = "Chọn ít nhất một việc cần làm.";
    return l;
  }
  function kiemBuoc2() {
    const l = {};
    if (!xe.dong) l["xe.dong"] = xe.hang ? "Chọn dòng xe." : "Chọn hãng và dòng xe.";
    if (bienSo.trim() && !chuanHoaBienSo(bienSo)) l["xe.bienSo"] = "Biển số chưa đúng, ví dụ 30A-123.45 (gõ liền 30a12345 cũng được).";
    if (soKm !== "" && !(Number.isInteger(Number(soKm)) && Number(soKm) >= 0 && Number(soKm) < 3000000)) l["xe.soKm"] = "Số km chưa đúng.";
    return l;
  }
  async function kiemBuoc3() {
    const l = {};
    if (!vt.coViTri) l["viTri.diaChi"] = "Cho biết vị trí xe: bấm lấy vị trí hoặc gõ địa chỉ.";
    else if (vt.toaDo && vt.dangKiem) l["viTri.diaChi"] = "Đang kiểm tra vị trí, chờ một chút rồi bấm lại.";
    else {
      const kt = vt.ketQua ? { ok: true, ketQua: vt.ketQua } : await vt.kiemDiaChi();
      if (kt?.ok && !kt.ketQua.trongVung) l["viTri.diaChi"] = "Địa chỉ này ngoài vùng phục vụ.";
      // Bản đồ lỗi: vẫn cho đi tiếp, server kiểm lại vị trí khi nhận đơn
      else if (kt && !kt.ok && !kt.banDoLoi && !kt.cu) l["viTri.diaChi"] = kt.loi || "Chưa tìm được địa chỉ này, gõ rõ hơn (số nhà, đường, phường).";
    }
    if (!choDo) l["viTri.choDo"] = "Chọn nơi xe đang đỗ.";
    return l;
  }
  function kiemBuoc4() {
    const l = {};
    const ngayChon = lich.find((n) => n.ngay === ngay);
    if (!ngay || !khung || !datDuoc(ngayChon?.khung.find((k) => k.ma === khung))) l.khungGio = "Chọn ngày và khung giờ.";
    if (!hoTen.trim()) l["khach.hoTen"] = "Cho biết họ tên để thợ xưng hô.";
    if (!chuanHoaSdt(sdt)) l["khach.sdt"] = "Số điện thoại chưa đúng (10 số, bắt đầu bằng 03, 05, 07, 08, 09).";
    if (mst.trim() && !/^\d{10}(-\d{3})?$/.test(mst.replace(/\s/g, ""))) l["hoaDon.mst"] = "Mã số thuế gồm 10 số (hoặc 10 số, gạch ngang, 3 số).";
    if (ma.trim() && maKq && maKq.ma === ma.trim().toUpperCase() && !maKq.hopLe) l.ma = maKq.lyDo || "Mã này không dùng được.";
    if (!dongY) l.dongY = "Bạn cần tích ô đồng ý xử lý dữ liệu để gửi đơn.";
    return l;
  }

  const xoaLoiBuoc = (b) => setLoi((l) => Object.fromEntries(Object.entries(l).filter(([k]) => buocCuaTruong(k) !== b)));

  async function tiep() {
    if (dangGui) return;
    setLoiChung("");
    let l = {};
    if (buoc === 1) l = kiemBuoc1();
    else if (buoc === 2) l = kiemBuoc2();
    else if (buoc === 3) l = await kiemBuoc3();
    else l = kiemBuoc4();
    xoaLoiBuoc(buoc);
    const dau = Object.keys(l)[0];
    if (dau) {
      setLoi((cu) => ({ ...cu, ...l }));
      if (l.ma || l["hoaDon.mst"]) setMoThem(true);
      requestAnimationFrame(() => document.getElementById(ID_TRUONG[dau] || "")?.focus());
      return;
    }
    if (buoc < 4) return doiBuoc(buoc + 1);
    await gui();
  }

  // ---------- Mã giới thiệu / khuyến mãi ----------
  async function kiemMa(giaTri = ma, soDt = sdt) {
    const m = giaTri.trim().toUpperCase();
    if (!m) { setMaKq(null); datLoi("ma", ""); return null; }
    const sdtChuan = chuanHoaSdt(soDt) || undefined;
    if (maKq && maKq.ma === m && maKq.sdt === sdtChuan) return maKq;
    setDangKiemMa(true);
    const r = await goiApi("/api/ma-khuyen-mai/kiem-tra", { body: { ma: m, ...(sdtChuan ? { sdt: sdtChuan } : {}) } });
    setDangKiemMa(false);
    if (!r.ok) { datLoi("ma", r.status === 0 ? "" : r.data.loi); return null; }
    const kq = { ...r.data, ma: m, maChuan: r.data.hopLe ? r.data.ma : m, sdt: sdtChuan };
    setMaKq(kq);
    datLoi("ma", kq.hopLe ? "" : kq.lyDo || "Mã này không dùng được.");
    return kq;
  }

  useEffect(() => {
    if (ma) kiemMa(ma);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maLink]);

  async function traCuuMst() {
    const v = mst.replace(/\s/g, "");
    if (!/^\d{10}(-\d{3})?$/.test(v)) { if (v) datLoi("hoaDon.mst", "Mã số thuế gồm 10 số (hoặc 10 số, gạch ngang, 3 số)."); return; }
    datLoi("hoaDon.mst", "");
    setTraMst("Đang tìm tên công ty…");
    const r = await goiApi(`/api/doanh-nghiep/tra-mst?mst=${encodeURIComponent(v)}`, { method: "GET" });
    if (r.ok && r.data.ten) {
      setTenCongTy((t) => t || r.data.ten);
      setDiaChiCongTy((d) => d || r.data.diaChi || "");
      setTraMst("");
    } else setTraMst("Chưa tìm được tên công ty theo mã số thuế, bạn gõ tay giúp mình.");
  }

  // ---------- Gửi ----------
  async function gui() {
    setDangGui(true);
    setLoiChung("");
    let kqMa = null;
    if (ma.trim()) kqMa = await kiemMa(ma, sdt);
    if (kqMa && !kqMa.hopLe && !(maLink && ma.trim().toUpperCase() === maLink.toUpperCase())) {
      setDangGui(false);
      setMoThem(true);
      datLoi("ma", kqMa.lyDo || "Mã này không dùng được.");
      requestAnimationFrame(() => document.getElementById("ma-gt")?.focus());
      return;
    }
    const maGui = ma.trim().toUpperCase();
    const truongMa = !maGui ? {} : kqMa?.loai === "gioiThieu" || (kqMa && !kqMa.hopLe) ? { maGioiThieu: maGui } : { maKhuyenMai: maGui };
    const duLieuGui = {
      dichVu,
      trieuChung: trieuChung.trim(),
      xe: { hang: xe.hang, dong: xe.dong, doi: xe.doi || null, bienSo: bienSo.trim(), soKm: soKm === "" ? null : Number(soKm) },
      viTri: { ...vt.giaTriGui(), choDo, ghiChuChoTho: ghiChuTho.trim() },
      khungGio: { ngay, ma: khung },
      khach: { hoTen: hoTen.trim(), sdt },
      ...(mst.trim() ? { hoaDon: { mst: mst.replace(/\s/g, ""), tenCongTy: tenCongTy.trim(), diaChi: diaChiCongTy.trim() } } : {}),
      ...truongMa,
      dongY: true,
      nhacBaoDuong,
      nguon: layNguon(),
      website,
    };
    let body = duLieuGui;
    if (tep.length) {
      body = new FormData();
      body.append("duLieu", JSON.stringify(duLieuGui));
      for (const t of tep) body.append("tep", t.file, t.file.name);
      const video = tep.find((t) => t.loai === "video");
      if (video?.giay) body.append("thoiLuongVideo", String(Math.ceil(video.giay)));
    }
    const r = await goiApi("/api/don-hang/dat-lich", { body });
    setDangGui(false);
    if (r.ok) {
      setKetQua(r.data);
      ghiSuKien("guiForm");
      doiBuoc(5);
      return;
    }
    xuLyLoi(r);
  }

  function xuLyLoi({ status, data }) {
    const m = data.ma;
    let truong = { ...(data.truong || {}) };
    if (truong.maKhuyenMai || truong.maGioiThieu) { truong.ma = truong.maKhuyenMai || truong.maGioiThieu; delete truong.maKhuyenMai; delete truong.maGioiThieu; }
    if (m === "MA_KHUYEN_MAI_KHONG_DUNG_DUOC" && !truong.ma) truong.ma = data.loi;
    if (m === "NGOAI_VUNG") { vt.setKetQua(data.vung || null); truong["viTri.diaChi"] = "Địa chỉ này ngoài vùng phục vụ."; }
    if (m === "KHONG_TIM_THAY_DIA_CHI" || m === "THIEU_VI_TRI") truong["viTri.diaChi"] = data.loi;
    if (["KHUNG_DAY", "KHUNG_DA_QUA", "NGAY_NGHI", "KHUNG_KHONG_CO"].includes(m)) { truong.khungGio = data.loi; setKhung(""); taiLich(); }
    if (m === "DICH_VU_TAM_NGUNG" || m === "DICH_VU_KHONG_CO") truong.dichVu = data.loi;
    if (["TEP_QUA_LON", "TEP_SAI_LOAI", "QUA_NHIEU_TEP", "VIDEO_QUA_DAI"].includes(m)) truong.tep = data.loi;
    if (m === "XE_KHONG_CO" && !truong["xe.dong"]) truong["xe.dong"] = data.loi;
    const cacO = Object.keys(truong);
    if (!cacO.length) {
      setLoiChung(data.loi || "Chưa gửi được, thử lại hoặc gọi hotline.");
      return;
    }
    setLoi(truong);
    if (truong.ma || truong["hoaDon.mst"]) setMoThem(true);
    if (status === 400 || cacO.length > 1) setLoiChung(data.loi || "");
    const dau = cacO.sort((a, b) => buocCuaTruong(a) - buocCuaTruong(b))[0];
    doiBuoc(buocCuaTruong(dau), dau);
  }

  // ---------- Hiển thị ----------
  const xong = buoc === 5;
  const ngoaiVung = buoc === 3 && vt.ketQua && !vt.ketQua.trongVung;
  const mo = buoc === 1 ? dichVu.length > 0 : buoc === 3 ? !ngoaiVung : true;
  const giaHien = gia?.trangThai === "chuaChon" || !dichVu.length ? "Chọn dịch vụ" : gia?.hienThi || "Chọn dịch vụ";
  const ghiChuGia = !dichVu.length ? (phi?.hienThi?.phiDiLai ? `Phí đi lại ${phi.hienThi.phiDiLai}. Chọn việc cần làm để xem khoảng giá.` : "") : gia?.ghiChu || "";

  const goiYMa = dangKiemMa ? "Đang kiểm tra mã…" : maKq?.hopLe && maKq.ma === ma.trim().toUpperCase() ? `Mã dùng được: ${maKq.moTa}` : undefined;
  const loiXe = useMemo(() => ({ hang: loi["xe.hang"], dong: loi["xe.dong"], doi: loi["xe.doi"] }), [loi]);
  const doiXe = useCallback((v) => {
    setXe((cu) => (cu.hang === v.hang && cu.dong === v.dong && cu.doi === v.doi ? cu : { hang: v.hang, dong: v.dong, doi: v.doi }));
    if (v.dong) datLoi("xe.dong", "");
  }, [datLoi]);

  return (
    <>
      <DauLuong
        tieuDe={xong ? "Hoàn tất" : "Đặt lịch"}
        buoc={xong ? null : buoc}
        onQuayLai={buoc > 1 && !xong ? () => doiBuoc(buoc - 1) : undefined}
      />
      {khongJs ? <div>{khongJs}</div> : null}
      <div className={s.noiDung}>
        {buoc === 1 && (
          <section className={s.buoc} aria-labelledby="tieu-de-buoc">
            <h1 id="tieu-de-buoc" ref={tieuDeRef} tabIndex={-1} className={s.h1}>{TIEU_DE[1]}</h1>
            <p className={s.moTa}>Chọn một hoặc nhiều việc.</p>
            <div id="nhom-dich-vu" tabIndex={-1} className={s.vungNhom}>
              <ChonDichVu dichVu={dsDichVu} chon={dichVu} onDoi={(v) => { setDichVu(v); if (v.length) datLoi("dichVu", ""); }} loi={loi.dichVu} />
            </div>
            <TruongNhap id="trieu-chung" nhan="Mô tả triệu chứng (không bắt buộc)">
              <textarea {...oNhap("trieu-chung")} rows={3} maxLength={2000} placeholder="VD: sáng nay đề không nổ, đèn taplo mờ"
                value={trieuChung} onChange={(e) => setTrieuChung(e.target.value)} />
            </TruongNhap>
            {gioiHanTep ? <TepDinhKem tep={tep} onDoi={(t) => { setTep(t); datLoi("tep", ""); }} gioiHan={gioiHanTep} loi={loi.tep} /> : null}
          </section>
        )}

        {buoc === 2 && (
          <section className={s.buoc} aria-labelledby="tieu-de-buoc">
            <h1 id="tieu-de-buoc" ref={tieuDeRef} tabIndex={-1} className={s.h1}>{TIEU_DE[2]}</h1>
            <div className={s.chonXe}>
              <ChonXe danhMuc={hangXe} giaTri={xe} onChange={doiXe} loi={loiXe} idTien="xe" />
            </div>
            <TruongNhap id="bien-so" className={s.bienSo} nhan="Biển số" loi={loi["xe.bienSo"]} goiY="Gõ liền cũng được, hệ thống tự thêm dấu.">
              <input {...oNhap("bien-so", loi["xe.bienSo"], "Gõ liền cũng được, hệ thống tự thêm dấu.")}
                type="text" autoCapitalize="characters" autoComplete="off" placeholder="30A-123.45" maxLength={20}
                value={bienSo} onChange={(e) => { setBienSo(e.target.value); if (loi["xe.bienSo"]) datLoi("xe.bienSo", ""); }}
                onBlur={() => {
                  if (!bienSo.trim()) return;
                  const c = chuanHoaBienSo(bienSo);
                  if (c) setBienSo(c); else datLoi("xe.bienSo", "Biển số chưa đúng, ví dụ 30A-123.45 (gõ liền 30a12345 cũng được).");
                }} />
            </TruongNhap>
            <TruongNhap id="so-km" nhan="Số km hiện tại (không bắt buộc)" loi={loi["xe.soKm"]}>
              <input {...oNhap("so-km", loi["xe.soKm"])} type="number" inputMode="numeric" min={0} step={1} placeholder="VD: 45000"
                value={soKm} onChange={(e) => { setSoKm(e.target.value); datLoi("xe.soKm", ""); }} />
            </TruongNhap>
          </section>
        )}

        {buoc === 3 && (
          <section className={s.buoc} aria-labelledby="tieu-de-buoc">
            <h1 id="tieu-de-buoc" ref={tieuDeRef} tabIndex={-1} className={s.h1}>{TIEU_DE[3]}</h1>
            <OViTri vt={vt} id="dia-chi" nhanNut="Lấy vị trí hiện tại" nhanO="Hoặc gõ địa chỉ" goiY="Số nhà, đường, phường"
              loi={vt.ketQua && !vt.ketQua.trongVung ? undefined : loi["viTri.diaChi"]} hotline={hotline} />
            <fieldset className={s.fieldset} id="nhom-cho-do" tabIndex={-1} aria-describedby={loi["viTri.choDo"] ? "choDo-loi" : undefined}>
              <legend className={s.legend}>Xe đỗ ở đâu?</legend>
              <div className={s.luoi2}>
                {dsChoDo.map((c) => (
                  <NutChon key={c.value} chon={choDo === c.value} onClick={() => { setChoDo(c.value); datLoi("viTri.choDo", ""); }}>{c.label}</NutChon>
                ))}
              </div>
              {loi["viTri.choDo"] ? <span id="choDo-loi" className={s.loi} role="alert">{loi["viTri.choDo"]}</span> : null}
            </fieldset>
            {choDo === "ham" ? (
              <p className={s.ghiChuHam}>Xe trong hầm chung cư: bạn báo trước với ban quản lý để thợ được vào. Ghi rõ tầng hầm, ô đỗ ở ô dưới.</p>
            ) : null}
            <TruongNhap id="ghi-chu-tho" nhan="Ghi chú cho thợ">
              <input {...oNhap("ghi-chu-tho")} type="text" maxLength={500} placeholder="VD: hầm B2, ô số 115" value={ghiChuTho} onChange={(e) => setGhiChuTho(e.target.value)} />
            </TruongNhap>
          </section>
        )}

        {buoc === 4 && (
          <section className={s.buoc} aria-labelledby="tieu-de-buoc">
            <h1 id="tieu-de-buoc" ref={tieuDeRef} tabIndex={-1} className={s.h1}>{TIEU_DE[4]}</h1>
            <div id="nhom-khung-gio" tabIndex={-1} className={s.vungNhom}>
              <ChonNgayGio lich={lich} ngay={ngay} khung={khung} dangTai={dangTaiLich} loi={loi.khungGio}
                onChonNgay={(n) => { setNgay(n); setKhung(""); }}
                onChonKhung={(k) => { setKhung(k); datLoi("khungGio", ""); }} />
            </div>
            <div className={s.luoi2Rong}>
              <TruongNhap id="ho-ten" nhan="Họ tên" loi={loi["khach.hoTen"]}>
                <input {...oNhap("ho-ten", loi["khach.hoTen"])} type="text" autoComplete="name" maxLength={80} placeholder="Nguyễn Văn A"
                  value={hoTen} onChange={(e) => { setHoTen(e.target.value); if (e.target.value.trim()) datLoi("khach.hoTen", ""); }}
                  onBlur={() => { if (!hoTen.trim()) datLoi("khach.hoTen", "Cho biết họ tên để thợ xưng hô."); }} />
              </TruongNhap>
              <TruongNhap id="sdt" nhan="Số điện thoại" loi={loi["khach.sdt"]}>
                <input {...oNhap("sdt", loi["khach.sdt"])} type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder="09xx xxx xxx"
                  value={sdt} onChange={(e) => { setSdt(e.target.value); if (chuanHoaSdt(e.target.value)) datLoi("khach.sdt", ""); }}
                  onBlur={() => {
                    if (sdt && !chuanHoaSdt(sdt)) datLoi("khach.sdt", "Số điện thoại chưa đúng (10 số, bắt đầu bằng 03, 05, 07, 08, 09).");
                    else if (ma.trim() && chuanHoaSdt(sdt)) kiemMa(ma, sdt);
                  }} />
              </TruongNhap>
            </div>
            <details className={s.them} open={moThem} onToggle={(e) => setMoThem(e.currentTarget.open)}>
              <summary>Xuất hoá đơn công ty, mã giới thiệu</summary>
              <div className={s.themNoiDung}>
                <TruongNhap id="mst" nhan="Mã số thuế" loi={loi["hoaDon.mst"]} goiY={traMst || "Tự điền tên công ty."}>
                  <input {...oNhap("mst", loi["hoaDon.mst"], traMst || "Tự điền tên công ty.")} type="text" inputMode="numeric" maxLength={14} placeholder="Mã số thuế (tự điền tên công ty)"
                    value={mst} onChange={(e) => { setMst(e.target.value); datLoi("hoaDon.mst", ""); setTraMst(""); }} onBlur={traCuuMst} />
                </TruongNhap>
                {mst.trim() ? (
                  <TruongNhap id="ten-cong-ty" nhan="Tên công ty">
                    <input {...oNhap("ten-cong-ty")} type="text" maxLength={200} value={tenCongTy} onChange={(e) => setTenCongTy(e.target.value)} />
                  </TruongNhap>
                ) : null}
                <TruongNhap id="ma-gt" nhan="Mã giới thiệu / khuyến mãi" loi={loi.ma} goiY={goiYMa}>
                  <input {...oNhap("ma-gt", loi.ma, goiYMa)} type="text" autoCapitalize="characters" autoComplete="off" maxLength={40}
                    placeholder="Mã giới thiệu / khuyến mãi" value={ma}
                    onChange={(e) => { setMa(e.target.value); setMaKq(null); datLoi("ma", ""); }} onBlur={() => kiemMa()} />
                </TruongNhap>
              </div>
            </details>
            <ODongY id="dongY" checked={dongY} onChange={(e) => { setDongY(e.target.checked); if (e.target.checked) datLoi("dongY", ""); }}
              noiDung="Tôi đồng ý cho xử lý dữ liệu cá nhân để phục vụ đơn này" linkChinhSach={lienHe?.chinhSachDuLieu || "/chinh-sach-du-lieu/"} loi={loi.dongY} />
            <OTich id="nhac-bao-duong" checked={nhacBaoDuong} onChange={(e) => setNhacBaoDuong(e.target.checked)}>
              Nhắc tôi lịch bảo dưỡng tiếp theo qua Zalo.
            </OTich>
            <OBay value={website} onChange={(e) => setWebsite(e.target.value)} />
          </section>
        )}

        {xong && ketQua && <XacNhan kq={ketQua} tieuDeRef={tieuDeRef} />}
      </div>

      {!xong && (
        <FooterGia gia={giaHien} ghiChu={ghiChuGia} dangTinh={dangTinh} mo={mo} dangGui={dangGui}
          nhanNut={buoc === 4 ? "Gửi yêu cầu" : "Tiếp tục"} onTiep={tiep}>
          {loiChung ? (
            <p className="bao bao-loi" role="alert">
              {loiChung}{" "}
              {hotline ? <a href={telHref(hotline)}>Gọi {hotline}</a> : null}
            </p>
          ) : null}
        </FooterGia>
      )}
    </>
  );
}

function XacNhan({ kq, tieuDeRef }) {
  let link = kq.linkTheoDoi;
  try { link = new URL(kq.linkTheoDoi).pathname; } catch { /* giữ nguyên */ }
  const v = kq.viTri;
  return (
    <section className={s.xong} aria-labelledby="tieu-de-xong">
      <span className={s.dauTich}><Icon name="check" size={36} /></span>
      <h1 id="tieu-de-xong" ref={tieuDeRef} tabIndex={-1} className={s.h1Xong}>Đã nhận yêu cầu</h1>
      <p className={s.phu}>Nhân viên sẽ gọi lại để xác nhận lịch.</p>
      <div className={s.theMa}>
        <span>Mã đơn</span>
        <b data-ma-don>{kq.ma}</b>
      </div>
      <dl className={s.chiTiet}>
        {kq.khungGio?.nhan ? <div><dt>Khung giờ</dt><dd>{kq.khungGio.nhan}</dd></div> : null}
        {v?.quan ? (
          <div><dt>Khu vực</dt><dd>{[v.phuong, v.quan].filter(Boolean).join(", ")}{v.etaTu ? ` · thợ tới ${v.etaTu}–${v.etaDen} phút` : ""}</dd></div>
        ) : null}
        {kq.giaSoBo?.hienThi ? <div><dt>Giá sơ bộ</dt><dd className={s.giaXong}>{kq.giaSoBo.hienThi}</dd></div> : null}
        {kq.khuyenMai?.moTa ? <div><dt>Mã {kq.khuyenMai.ma}</dt><dd>{kq.khuyenMai.moTa}</dd></div> : null}
        {kq.gioiThieu && kq.gioiThieu.ma !== kq.khuyenMai?.ma ? <div><dt>Mã {kq.gioiThieu.ma}</dt><dd>{kq.gioiThieu.apDung ? kq.gioiThieu.moTa : kq.gioiThieu.lyDo}</dd></div> : null}
      </dl>
      {kq.giaSoBo?.ghiChu ? <p className={s.ghiChuNho}>{kq.giaSoBo.ghiChu}</p> : null}
      <p className={s.phu}>Tin xác nhận và link theo dõi thợ đã gửi vào Zalo của bạn.</p>
      <a href={link} className={`nut nut-toi nut-day ${s.nutTheoDoi}`}>Theo dõi đơn</a>
      <Link href="/" className={s.linkPhu}>Về trang chủ</Link>
    </section>
  );
}
