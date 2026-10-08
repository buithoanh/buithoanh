// Ô nhập dùng chung cho mọi form: luôn có <label>, lỗi tiếng Việt ngay dưới ô (aria-describedby),
// ô đồng ý xử lý dữ liệu cá nhân (bắt buộc theo NĐ 13/2023) và ô bẫy bot.
// Dùng được trong client component (truyền value/onChange) và server component (form thường).
import s from "./Form.module.css";

export function TruongNhap({ id, nhan, loi, goiY, children, className = "", batBuoc = false }) {
  return (
    <div className={`${s.truong} ${className}`}>
      <label htmlFor={id} className={s.nhan}>
        {nhan}{batBuoc ? <span className={s.sao} aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {goiY && !loi ? <span id={`${id}-goi-y`} className={s.goiY}>{goiY}</span> : null}
      {loi ? <span id={`${id}-loi`} className={s.loi} role="alert">{loi}</span> : null}
    </div>
  );
}

/** Thuộc tính cho <input>/<select>/<textarea> bên trong TruongNhap: id, class, aria-invalid, aria-describedby. */
export function oNhap(id, loi, goiY) {
  return {
    id,
    name: id,
    className: `${s.o} ${loi ? s.oLoi : ""}`,
    "aria-invalid": loi ? true : undefined,
    "aria-describedby": loi ? `${id}-loi` : goiY ? `${id}-goi-y` : undefined,
  };
}

/** Ô đồng ý xử lý dữ liệu. `noiDung` theo từng form, ví dụ "Tôi đồng ý cho xử lý dữ liệu cá nhân để phục vụ đơn này". */
export function ODongY({ id = "dongY", checked, onChange, noiDung, linkChinhSach = "/chinh-sach-du-lieu/", loi, batBuoc = true }) {
  return (
    <div className={s.oTich}>
      <label htmlFor={id}>
        <input
          type="checkbox" id={id} name={id} checked={checked} onChange={onChange} required={batBuoc}
          aria-invalid={loi ? true : undefined} aria-describedby={loi ? `${id}-loi` : undefined}
        />
        <span>
          {noiDung} (<a href={linkChinhSach} target="_blank" rel="noopener">chính sách</a>).
          {batBuoc ? <b className={s.batBuoc}> Bắt buộc</b> : null}
        </span>
      </label>
      {loi ? <span id={`${id}-loi`} className={s.loi} role="alert">{loi}</span> : null}
    </div>
  );
}

/** Ô tích thường (nhắc bảo dưỡng…). */
export function OTich({ id, checked, onChange, children }) {
  return (
    <div className={s.oTich}>
      <label htmlFor={id}>
        <input type="checkbox" id={id} name={id} checked={checked} onChange={onChange} />
        <span>{children}</span>
      </label>
    </div>
  );
}

/** Ô bẫy bot: người thật không thấy, luôn để trống (server bỏ qua đơn có giá trị). */
export function OBay({ value, onChange }) {
  return (
    <div className={s.bay} aria-hidden="true">
      <label htmlFor="website">Website</label>
      <input id="website" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={onChange} />
    </div>
  );
}

export const lopForm = s;
