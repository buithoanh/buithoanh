// Mọi đường /api/quan-tri/* (trừ đăng nhập) phải có phiên hợp lệ.
import { json } from "../../../cf/db.js";
import { validSession } from "../../../cf/session.js";

export async function onRequest({ request, env, next }) {
  const path = new URL(request.url).pathname.replace(/\/$/, "");
  if (path === "/api/quan-tri/dang-nhap") return next();
  if (!env.ADMIN_PASSWORD) return json({ loi: "Chưa đặt mật khẩu quản trị (ADMIN_PASSWORD)." }, 503);
  if (!(await validSession(request, env.ADMIN_PASSWORD))) return json({ loi: "Chưa đăng nhập." }, 401);
  // Chặn gửi chéo trang: thao tác ghi phải là JSON (form của trang khác không gửi được JSON kèm cookie).
  if (request.method !== "GET" && !(request.headers.get("Content-Type") || "").includes("application/json")) {
    return json({ loi: "Yêu cầu không hợp lệ." }, 415);
  }
  return next();
}
