"use client";
// Form "Đăng ký làm thợ cộng tác" (thiết kế TuyenTho): thông tin, dụng cụ đang có, tối đa 3 ảnh chứng chỉ.
// Gửi multipart POST /api/tuyen-tho/ho-so: ô duLieu = JSON, ô tep lặp lại cho từng ảnh (docs/api.md mục 8).
import { useEffect, useRef, useState } from "react";
import { TruongNhap, oNhap, ODongY, OBay } from "../chung/Form";
import Icon from "../Icon";
import { ghiSuKien } from "@/lib/su-kien-client";
import { kiemTraHoSoTho } from "@/lib/p2-dau-vao.mjs";
import { dungForm } from "./dungForm";
import { DaGui } from "./KhoiP2";
import f from "./FormP2.module.css";
import s from "./FormTuyenTho.module.css";

const kiemTra = (v) => kiemTraHoSoTho({ ...v, khuVuc: v.khuVuc ? [v.khuVuc] : [] });

export default function FormTuyenTho({ luaChon, anh, chinhSach }) {
  const form = dungForm({ hoTen: "", sdt: "", namKinhNghiem: "", khuVuc: "", dungCu: [], dongY: false, website: "" }, kiemTra);
  const { giaTri: v, doi, roi, loi } = form;
  const [tep, datTep] = useState([]); // [{ file, url }]
  const [loiAnh, datLoiAnh] = useState("");
  const [ketQua, datKetQua] = useState(null);
  const oTep = useRef(null);
  const toiDa = anh?.toiDa || 3;
  const toiDaMB = anh?.toiDaMB || 8;
  const loaiNhan = anh?.loai || ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

  // Giải phóng ảnh xem trước khi rời trang
  const tepRef = useRef(tep);
  tepRef.current = tep;
  useEffect(() => () => tepRef.current.forEach((t) => URL.revokeObjectURL(t.url)), []);

  function themAnh(e) {
    const moi = [...(e.target.files || [])];
    e.target.value = "";
    datLoiAnh("");
    const nhan = [];
    for (const file of moi) {
      if (tep.length + nhan.length >= toiDa) { datLoiAnh(`Tối đa ${toiDa} ảnh.`); break; }
      const laAnh = loaiNhan.includes(file.type) || /\.(heic|heif)$/i.test(file.name);
      if (!laAnh) { datLoiAnh("Chỉ nhận ảnh (JPG, PNG, WEBP, HEIC)."); continue; }
      if (file.size > toiDaMB * 1024 * 1024) { datLoiAnh(`Ảnh "${file.name}" lớn hơn ${toiDaMB} MB, chụp lại ảnh nhẹ hơn giúp nhé.`); continue; }
      nhan.push({ file, url: URL.createObjectURL(file) });
    }
    if (nhan.length) datTep((cu) => [...cu, ...nhan]);
  }
  function xoaAnh(i) {
    datTep((cu) => {
      URL.revokeObjectURL(cu[i].url);
      return cu.filter((_, j) => j !== i);
    });
    datLoiAnh("");
    requestAnimationFrame(() => oTep.current?.focus());
  }
  const batDungCu = (id) => doi("dungCu", v.dungCu.includes(id) ? v.dungCu.filter((x) => x !== id) : [...v.dungCu, id]);

  async function gui(e) {
    e.preventDefault();
    const kq = await form.gui((gt) => {
      const fd = new FormData();
      fd.set("duLieu", JSON.stringify({ ...gt, khuVuc: gt.khuVuc ? [gt.khuVuc] : [] }));
      for (const t of tep) fd.append("tep", t.file, t.file.name);
      return fetch("/api/tuyen-tho/ho-so", { method: "POST", body: fd });
    });
    if (kq) {
      ghiSuKien("guiForm");
      datKetQua(kq);
      requestAnimationFrame(() => document.getElementById("da-gui-tho")?.focus());
    }
  }

  if (ketQua) {
    return (
      <DaGui
        idTieuDe="da-gui-tho" tieuDe="Đã nhận hồ sơ của bạn" nhanMa="Mã hồ sơ" ma={ketQua.ma}
        moTa={ketQua.camKet || "Bộ phận nhân sự sẽ gọi lại cho bạn để hẹn lịch kiểm tra tay nghề."}
      >
        {ketQua.nhanSu?.zalo ? (
          <a className="nut nut-zalo nut-day" href={ketQua.nhanSu.zalo} target="_blank" rel="noopener">
            <Icon name="chat" /> Nhắn Zalo nhân sự nếu cần hỏi thêm
          </a>
        ) : null}
      </DaGui>
    );
  }

  return (
    <form onSubmit={gui} noValidate className={`the ${f.form}`} aria-labelledby="tieu-de-dang-ky-tho">
      <div>
        <h2 id="tieu-de-dang-ky-tho">Đăng ký làm thợ cộng tác</h2>
        <p className="phu">Mất khoảng 3 phút. Hồ sơ chuyển thẳng tới bộ phận nhân sự.</p>
      </div>
      <TruongNhap id="hoTen" nhan="Họ tên" loi={loi.hoTen}>
        <input {...oNhap("hoTen", loi.hoTen)} autoComplete="name" placeholder="Nguyễn Văn Tùng" value={v.hoTen} onChange={(e) => doi("hoTen", e.target.value)} onBlur={() => roi("hoTen")} />
      </TruongNhap>
      <div className={s.haiLech}>
        <TruongNhap id="sdt" nhan="Số điện thoại" loi={loi.sdt}>
          <input {...oNhap("sdt", loi.sdt)} type="tel" inputMode="tel" autoComplete="tel" placeholder="0975 123 456" value={v.sdt} onChange={(e) => doi("sdt", e.target.value)} onBlur={() => roi("sdt")} />
        </TruongNhap>
        <TruongNhap id="namKinhNghiem" nhan="Năm kinh nghiệm" loi={loi.namKinhNghiem}>
          <select {...oNhap("namKinhNghiem", loi.namKinhNghiem)} value={v.namKinhNghiem} onChange={(e) => doi("namKinhNghiem", e.target.value)} onBlur={() => roi("namKinhNghiem")}>
            <option value="">Chọn</option>
            {luaChon.namKinhNghiem.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </TruongNhap>
      </div>
      <TruongNhap id="khuVuc" nhan="Khu vực muốn nhận đơn" loi={loi.khuVuc}>
        <select {...oNhap("khuVuc", loi.khuVuc)} value={v.khuVuc} onChange={(e) => doi("khuVuc", e.target.value)} onBlur={() => roi("khuVuc")}>
          <option value="">Chọn khu vực</option>
          {luaChon.khuVuc.map((o) => <option key={o.value} value={o.value}>{o.value === "khac" ? "Khu vực khác (chờ mở rộng)" : o.label}</option>)}
        </select>
      </TruongNhap>
      <fieldset className={f.nhom}>
        <legend>Dụng cụ bạn đang có</legend>
        <span className={f.goiYNhom} id="goi-y-dung-cu">Chọn nhiều. Thiếu cũng không sao, công ty cấp bộ đồ nghề khi vào tổ.</span>
        <div className={f.dsHai}>
          {luaChon.dungCu.map((o) => {
            const on = v.dungCu.includes(o.value);
            return (
              <button key={o.value} type="button" aria-pressed={on} className={s.dungCu} onClick={() => batDungCu(o.value)}>
                <span className={s.oVuong} aria-hidden="true">{on ? <Icon name="check" size={14} /> : null}</span>
                <span>{o.label}</span>
              </button>
            );
          })}
        </div>
        <span className={f.daChon} aria-live="polite">Đã chọn {v.dungCu.length} dụng cụ</span>
        {loi.dungCu ? <span className={f.loi} role="alert">{loi.dungCu}</span> : null}
      </fieldset>
      <div className={f.nhom} role="group" aria-labelledby="nhan-anh">
        <span id="nhan-anh" className={s.nhanAnh}>Ảnh chứng chỉ, bằng nghề</span>
        <div className={s.luoiAnh}>
          {tep.map((t, i) => (
            <div key={t.url} className={s.anh}>
              <img src={t.url} alt={`Ảnh ${i + 1}: ${t.file.name}`} />
              <button type="button" className={s.xoa} aria-label={`Xoá ảnh ${i + 1} (${t.file.name})`} onClick={() => xoaAnh(i)}>
                <Icon name="dong-x" size={16} />
              </button>
            </div>
          ))}
          {tep.length < toiDa ? (
            <label className={s.them}>
              <Icon name="may-anh" size={22} />
              <span>Thêm ảnh</span>
              <input ref={oTep} type="file" accept={loaiNhan.join(",")} multiple onChange={themAnh} className={s.oFile} aria-describedby="goi-y-anh" />
            </label>
          ) : null}
        </div>
        <span id="goi-y-anh" className="phu nho">Tối đa {toiDa} ảnh, mỗi ảnh dưới {toiDaMB} MB: chứng chỉ nghề, bằng lái, chứng chỉ hãng nếu có.</span>
        {loiAnh || loi.anh ? <span className={f.loi} role="alert">{loiAnh || loi.anh}</span> : null}
      </div>
      <ODongY
        checked={v.dongY} onChange={(e) => doi("dongY", e.target.checked)} loi={loi.dongY} linkChinhSach={chinhSach}
        noiDung="Tôi đồng ý cho dùng thông tin này để xét tuyển"
      />
      <OBay value={v.website} onChange={(e) => doi("website", e.target.value)} />
      {form.loiChung ? <p className="bao bao-loi" role="alert">{form.loiChung}</p> : null}
      <button type="submit" className={`nut nut-chinh nut-day ${f.nutGui}`} disabled={form.dangGui}>
        {form.dangGui ? "Đang gửi hồ sơ…" : "Gửi hồ sơ"}
      </button>
    </form>
  );
}
