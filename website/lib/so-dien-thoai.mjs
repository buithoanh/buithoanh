// Số điện thoại di động Việt Nam: chuẩn hoá về dạng 0xxxxxxxxx (10 số) và che khi hiển thị công khai.

export function chuanHoaSdt(dauVao) {
  let s = String(dauVao ?? "").replace(/[\s.\-()]/g, "");
  if (s.startsWith("+84")) s = "0" + s.slice(3);
  else if (/^84\d{9}$/.test(s)) s = "0" + s.slice(2);
  return /^0[35789]\d{8}$/.test(s) ? s : null;
}

/** 0912345345 → "0912 xxx 345" (dùng trên link công khai, theo Nghị định 13/2023). */
export function cheSdt(sdt) {
  const s = chuanHoaSdt(sdt) || String(sdt ?? "");
  if (s.length < 7) return "xxx";
  return `${s.slice(0, 4)} xxx ${s.slice(-3)}`;
}
