// Giới hạn tần suất trong bộ nhớ server (đủ cho một máy chủ; chạy nhiều máy thì chuyển sang Redis/Postgres).
const KHO = new Map();

/**
 * Ghi một lần gọi theo khoá và cho biết có vượt giới hạn không.
 * @returns {{ vuot: boolean, conLaiGiay: number }}
 */
export function ghiNhan(khoa, { toiDa, trongMs }) {
  const now = Date.now();
  const gan = (KHO.get(khoa) || []).filter((t) => now - t < trongMs);
  const vuot = gan.length >= toiDa;
  if (!vuot) gan.push(now);
  KHO.set(khoa, gan);
  if (KHO.size > 20000) KHO.clear();
  return { vuot, conLaiGiay: vuot ? Math.ceil((trongMs - (now - gan[0])) / 1000) : 0 };
}

export const xoaGioiHan = () => KHO.clear();
