// POST /api/quan-tri/dang-nhap {matKhau} → đặt cookie phiên. DELETE → đăng xuất.
import { json } from "../../../cf/db.js";
import { newSessionCookie, clearCookie, sameText } from "../../../cf/session.js";

const isSecure = (request) => new URL(request.url).protocol === "https:";

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) return json({ loi: "Chưa đặt mật khẩu quản trị (ADMIN_PASSWORD) trong Cloudflare." }, 503);
  let body = {};
  try { body = await request.json(); } catch {}
  if (!(await sameText(body.matKhau || "", env.ADMIN_PASSWORD))) {
    await new Promise((r) => setTimeout(r, 800)); // làm chậm việc dò mật khẩu
    return json({ loi: "Sai mật khẩu." }, 401);
  }
  return json({ ok: true }, 200, { "Set-Cookie": await newSessionCookie(env.ADMIN_PASSWORD, isSecure(request)) });
}

export async function onRequestDelete({ request }) {
  return json({ ok: true }, 200, { "Set-Cookie": clearCookie(isSecure(request)) });
}
