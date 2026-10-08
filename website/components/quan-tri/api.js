// Gọi API backend từ màn quản trị (trình duyệt, cookie payload-token đi kèm).
// Gom các kiểu lỗi về một câu tiếng Việt: { loi } của endpoint riêng, { errors: [{ message, data }] } của REST Payload.
export async function goiApi(url, { method = "GET", body } = {}) {
  const r = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let d = null;
  try {
    d = await r.json();
  } catch {
    d = null;
  }
  if (!r.ok) {
    const chiTiet = (d?.errors || []).flatMap((e) => (e?.data?.errors?.length ? e.data.errors.map((x) => x.message) : [e.message]));
    const loi = d?.loi || chiTiet.filter(Boolean).join("\n") ||
      (r.status === 401 ? "Phiên đăng nhập đã hết. Tải lại trang để đăng nhập lại." : r.status === 403 ? "Bạn không có quyền làm việc này." : `Lỗi máy chủ (${r.status}).`);
    const e = new Error(loi);
    e.status = r.status;
    e.duLieu = d;
    throw e;
  }
  return d;
}

/** "1.250.000đ" (0 → "Miễn phí" khi mienPhi). */
export const dinhDangTien = (n, mienPhi = false) =>
  n == null || Number.isNaN(Number(n)) ? "—" : mienPhi && Number(n) === 0 ? "Miễn phí" : `${Number(n).toLocaleString("vi-VN")}đ`;

/** Đọc số tiền người dùng gõ: "170.000đ", "170000", "170 000" → 170000. Rỗng hoặc sai → null. */
export const docSoTien = (chu) => {
  const s = String(chu ?? "").trim();
  if (/^miễn phí$/i.test(s)) return 0;
  const so = s.replace(/[^\d]/g, "");
  return so ? Number(so) : null;
};

/** "08/10/2026 09:42" theo giờ Việt Nam. */
export const ngayGio = (iso) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
export const ngay = (iso) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" }) : "";
