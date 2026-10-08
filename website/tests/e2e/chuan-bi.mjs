// Chạy một lần trước bộ e2e (globalSetup). CHỈ dùng trên database kiểm thử:
// nâng "Số đơn tối đa" mỗi khung giờ lên 1000 để các lần chạy (mỗi lần tạo ~12 đơn) không làm kín lịch 4 ngày tới.
import { GOC, MAT_KHAU, IP_GIA } from "./chung.mjs";

export default async function chuanBi() {
  const r = await fetch(`${GOC}/api/users/login`, {
    method: "POST", headers: { "Content-Type": "application/json", ...IP_GIA }, body: JSON.stringify({ email: "quantri@thotoi.test", password: MAT_KHAU }),
  });
  if (!r.ok) throw new Error(`Không đăng nhập được quantri@thotoi.test (${r.status}). Đã chạy nap-du-lieu với NAP_DU_LIEU_THU=1 chưa?`);
  const auth = { Authorization: `JWT ${(await r.json()).token}`, "Content-Type": "application/json" };
  const lich = await (await fetch(`${GOC}/api/globals/lich-nhan-don?depth=0`, { headers: auth })).json();
  const khungGio = (lich.khungGio || []).map((k) => ({ ...k, soDonToiDa: Math.max(k.soDonToiDa ?? 0, 1000) }));
  const s = await fetch(`${GOC}/api/globals/lich-nhan-don`, { method: "POST", headers: auth, body: JSON.stringify({ khungGio }) });
  if (!s.ok) throw new Error(`Không nâng được số đơn mỗi khung: ${s.status} ${await s.text()}`);
}
