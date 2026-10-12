"use client";
// Form "Xin báo giá hợp đồng" (thiết kế DoanhNghiep). Nhập MST đủ 10 số thì tra (GET /api/doanh-nghiep/tra-mst)
// để tự điền tên, địa chỉ công ty. Gửi POST /api/doanh-nghiep/yeu-cau → mã DN-, người phụ trách.
import { useRef, useState } from "react";
import { TruongNhap, oNhap, ODongY, OBay } from "../chung/Form";
import Icon from "../Icon";
import { ghiSuKien, layNguon } from "@/lib/su-kien-client";
import { MST, chuanHoaMst, kiemTraYeuCauDoanhNghiep } from "@/lib/p2-dau-vao.mjs";
import { dungForm, guiJson } from "./dungForm";
import { DaGui } from "./KhoiP2";
import f from "./FormP2.module.css";

const kiemTra = (v) => kiemTraYeuCauDoanhNghiep({ ...v, khuVuc: v.khuVuc ? [v.khuVuc] : [] });

export default function FormDoanhNghiep({ luaChon, chinhSach, hoSoNangLuc }) {
  const form = dungForm({
    tenCongTy: "", mst: "", diaChi: "", soXe: "", loaiXe: luaChon.loaiXe[0]?.value || "", loaiDoiXe: "", khuVuc: "",
    nguoiLienHe: "", sdt: "", email: "", ghiChu: "", dongY: false, website: "",
  }, kiemTra);
  const { giaTri: v, doi, roi, loi } = form;
  const [mstTra, datMstTra] = useState({ trangThai: "", chu: "" });
  const daTra = useRef("");
  const [ketQua, datKetQua] = useState(null);

  async function traMst(gt) {
    const mst = chuanHoaMst(gt);
    if (!MST.test(mst) || daTra.current === mst) return;
    daTra.current = mst;
    datMstTra({ trangThai: "dang", chu: "Đang tra mã số thuế…" });
    try {
      const r = await fetch(`/api/doanh-nghiep/tra-mst?mst=${encodeURIComponent(mst)}`);
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ten) {
        form.datGiaTri((cu) => ({ ...cu, tenCongTy: cu.tenCongTy.trim() ? cu.tenCongTy : d.ten, diaChi: d.diaChi || cu.diaChi }));
        form.datLoi((l) => ({ ...l, tenCongTy: undefined, mst: undefined }));
        datMstTra({ trangThai: "ok", chu: `${d.ten}${d.diaChi ? ` · ${d.diaChi}` : ""}` });
      } else {
        datMstTra({ trangThai: "loi", chu: d.loi || "Chưa tra được mã số thuế, bạn gõ tên công ty giúp nhé." });
      }
    } catch {
      daTra.current = "";
      datMstTra({ trangThai: "loi", chu: "Chưa tra được mã số thuế lúc này, bạn gõ tên công ty giúp nhé." });
    }
  }

  async function gui(e) {
    e.preventDefault();
    const kq = await form.gui((gt) => guiJson("/api/doanh-nghiep/yeu-cau", {
      ...gt, soXe: Number(gt.soXe), mst: chuanHoaMst(gt.mst), khuVuc: gt.khuVuc ? [gt.khuVuc] : [], nguon: layNguon(),
    }));
    if (kq) {
      ghiSuKien("guiForm");
      datKetQua(kq);
      requestAnimationFrame(() => document.getElementById("da-gui-dn")?.focus());
    }
  }

  if (ketQua) {
    return (
      <DaGui
        idTieuDe="da-gui-dn" tieuDe="Đã gửi yêu cầu báo giá" nhanMa="Mã yêu cầu" ma={ketQua.ma}
        moTa={ketQua.camKet || "Sales doanh nghiệp sẽ liên hệ với bạn sớm."}
      >
        {ketQua.phuTrach ? (
          <p className={`nho ${f.phuTrach}`}>
            Phụ trách: <b>{ketQua.phuTrach.ten}</b>, sales doanh nghiệp
            {ketQua.phuTrach.sdt ? <> · <a href={`tel:${ketQua.phuTrach.sdt.replace(/[^\d+]/g, "")}`}>{ketQua.phuTrach.sdt}</a></> : null}
          </p>
        ) : null}
        {ketQua.hoSoNangLuc || hoSoNangLuc ? (
          <a className="nut nut-toi nut-day" href={ketQua.hoSoNangLuc || hoSoNangLuc} target="_blank" rel="noopener">
            <Icon name="tai-xuong" size={18} /> Tải hồ sơ năng lực trong lúc chờ
          </a>
        ) : null}
      </DaGui>
    );
  }

  const loiDoiXe = loi.loaiDoiXe;
  return (
    <form onSubmit={gui} noValidate className={`the ${f.form}`} aria-labelledby="tieu-de-bao-gia">
      <div>
        <h2 id="tieu-de-bao-gia">Xin báo giá hợp đồng</h2>
        <p className="phu">Điền 2 phút. Sales doanh nghiệp gửi báo giá chi tiết cho bạn.</p>
      </div>
      <TruongNhap id="tenCongTy" nhan="Tên công ty" loi={loi.tenCongTy}>
        <input {...oNhap("tenCongTy", loi.tenCongTy)} autoComplete="organization" placeholder="Công ty TNHH Vận tải Hồng Hà" value={v.tenCongTy} onChange={(e) => doi("tenCongTy", e.target.value)} onBlur={() => roi("tenCongTy")} />
      </TruongNhap>
      <TruongNhap id="mst" nhan="Mã số thuế (nếu có)" loi={loi.mst} goiY={mstTra.chu ? undefined : "Nhập xong, tên và địa chỉ công ty tự điền."}>
        <input
          {...oNhap("mst", loi.mst, mstTra.chu ? undefined : "Nhập xong, tên và địa chỉ công ty tự điền.")} inputMode="numeric" placeholder="0101234567" maxLength={14}
          value={v.mst} onChange={(e) => { doi("mst", e.target.value); if (MST.test(chuanHoaMst(e.target.value))) traMst(e.target.value); }}
          onBlur={() => { roi("mst"); traMst(v.mst); }}
          aria-describedby={loi.mst ? "mst-loi" : mstTra.chu ? "mst-tra" : "mst-goi-y"}
        />
        {mstTra.chu && !loi.mst ? (
          <span id="mst-tra" role="status" className={mstTra.trangThai === "ok" ? `nho ${f.mstOk}` : "phu nho"}>
            {mstTra.trangThai === "ok" ? <><Icon name="check" size={14} /> Đã tìm thấy: </> : null}{mstTra.chu}
          </span>
        ) : null}
      </TruongNhap>
      <div className={f.haiLech}>
        <TruongNhap id="soXe" nhan="Số xe" loi={loi.soXe}>
          <input {...oNhap("soXe", loi.soXe)} type="number" inputMode="numeric" min={1} placeholder="25" value={v.soXe} onChange={(e) => doi("soXe", e.target.value)} onBlur={() => roi("soXe")} />
        </TruongNhap>
        <TruongNhap id="loaiXe" nhan="Loại xe chính" loi={loi.loaiXe}>
          <select {...oNhap("loaiXe", loi.loaiXe)} value={v.loaiXe} onChange={(e) => doi("loaiXe", e.target.value)}>
            {luaChon.loaiXe.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </TruongNhap>
      </div>
      <fieldset className={f.nhom} aria-describedby={loiDoiXe ? "loaiDoiXe-loi" : undefined}>
        <legend>Đội xe thuộc loại</legend>
        <div className={f.ba} role="radiogroup" aria-label="Đội xe thuộc loại">
          {luaChon.loaiDoiXe.map((o, i) => (
            <button
              key={o.value} type="button" role="radio" aria-checked={v.loaiDoiXe === o.value} id={i === 0 ? "loaiDoiXe" : undefined}
              className={`${f.vien} ${loiDoiXe ? f.vienLoi : ""}`} onClick={() => doi("loaiDoiXe", o.value)}
            >{o.label}</button>
          ))}
        </div>
        {loiDoiXe ? <span id="loaiDoiXe-loi" className={f.loi} role="alert">{loiDoiXe}</span> : null}
      </fieldset>
      <TruongNhap id="khuVuc" nhan="Khu vực bãi xe" loi={loi.khuVuc}>
        <select {...oNhap("khuVuc", loi.khuVuc)} value={v.khuVuc} onChange={(e) => doi("khuVuc", e.target.value)} onBlur={() => roi("khuVuc")}>
          <option value="">Chọn khu vực</option>
          {luaChon.khuVuc.map((o) => (
            <option key={o.value} value={o.value}>{o.value === "khac" ? "Khu vực khác (sales gọi tư vấn)" : o.label}</option>
          ))}
        </select>
      </TruongNhap>
      <TruongNhap id="nguoiLienHe" nhan="Người liên hệ" loi={loi.nguoiLienHe}>
        <input {...oNhap("nguoiLienHe", loi.nguoiLienHe)} autoComplete="name" placeholder="Trần Thu Hà – Trưởng phòng hành chính" value={v.nguoiLienHe} onChange={(e) => doi("nguoiLienHe", e.target.value)} onBlur={() => roi("nguoiLienHe")} />
      </TruongNhap>
      <div className={f.hai}>
        <TruongNhap id="sdt" nhan="Số điện thoại" loi={loi.sdt}>
          <input {...oNhap("sdt", loi.sdt)} type="tel" inputMode="tel" autoComplete="tel" placeholder="0912 345 678" value={v.sdt} onChange={(e) => doi("sdt", e.target.value)} onBlur={() => roi("sdt")} />
        </TruongNhap>
        <TruongNhap id="email" nhan="Email" loi={loi.email}>
          <input {...oNhap("email", loi.email)} type="email" inputMode="email" autoComplete="email" placeholder="ketoan@congty.vn" value={v.email} onChange={(e) => doi("email", e.target.value)} onBlur={() => roi("email")} />
        </TruongNhap>
      </div>
      <TruongNhap id="ghiChu" nhan="Ghi chú (không bắt buộc)" loi={loi.ghiChu}>
        <textarea {...oNhap("ghiChu", loi.ghiChu)} rows={2} maxLength={2000} placeholder="VD: bãi ở Trung Kính, xe về bãi sau 21h" value={v.ghiChu} onChange={(e) => doi("ghiChu", e.target.value)} />
      </TruongNhap>
      <ODongY
        checked={v.dongY} onChange={(e) => doi("dongY", e.target.checked)} loi={loi.dongY} linkChinhSach={chinhSach}
        noiDung="Tôi đồng ý cho xử lý thông tin trên để gửi báo giá"
      />
      <OBay value={v.website} onChange={(e) => doi("website", e.target.value)} />
      {form.loiChung ? <p className="bao bao-loi" role="alert">{form.loiChung}</p> : null}
      <button type="submit" className={`nut nut-chinh nut-day ${f.nutGui}`} disabled={form.dangGui}>
        {form.dangGui ? "Đang gửi…" : "Gửi yêu cầu báo giá"}
      </button>
    </form>
  );
}
