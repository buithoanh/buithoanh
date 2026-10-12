// Đo mức trùng nội dung giữa hai trang (chống trang khu vực chỉ đổi tên quận).
// Cắt chữ thành cụm 5 chữ liên tiếp; tỷ lệ trùng = số cụm của trang A có trong trang B / số cụm của A.

const chu = (s) => String(s || "").toLowerCase().normalize("NFC").split(/[^\p{L}\p{N}]+/u).filter(Boolean);

export function cumChu(s, n = 5) {
  const w = chu(s);
  const out = new Set();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
}

/** 0–1. Văn bản quá ngắn (dưới 5 chữ) coi như không trùng. */
export function tyLeTrung(a, b, n = 5) {
  const A = cumChu(a, n);
  if (!A.size) return 0;
  const B = b instanceof Set ? b : cumChu(b, n);
  let trung = 0;
  for (const c of A) if (B.has(c)) trung++;
  return trung / A.size;
}
