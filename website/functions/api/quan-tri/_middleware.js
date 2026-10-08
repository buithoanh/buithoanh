// Mọi request /api/quan-tri/*: kiểm đăng nhập Cloudflare Access, phân quyền, chặn gửi lệnh từ trang khác.
import { xacThuc, LoiHttp } from "../../../lib/quan-tri/xac-thuc.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export async function onRequest(ctx) {
  try {
    ctx.data.user = await xacThuc(ctx.request, ctx.env);
    // Trình duyệt không tự gắn header lạ khi trang khác gửi form/ảnh tới đây, nên header này chặn CSRF.
    if (ctx.request.method !== "GET" && ctx.request.headers.get("x-quan-tri") !== "1") throw new LoiHttp(403, "Thiếu header x-quan-tri");
    return await ctx.next();
  } catch (e) {
    if (!(e instanceof LoiHttp)) console.error(e);
    return json({ loi: e instanceof LoiHttp ? e.message : "Lỗi máy chủ" }, e instanceof LoiHttp ? e.status : 500);
  }
}
