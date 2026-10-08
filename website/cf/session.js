// Phiên đăng nhập trang quản trị: cookie "qt" = <hạn>.<chữ ký HMAC>, ký bằng ADMIN_PASSWORD.
// Đổi mật khẩu trong Cloudflare là mọi phiên cũ hết hiệu lực.

export const COOKIE = "qt";
const MAX_AGE = 7 * 24 * 3600;
const enc = new TextEncoder();

async function sign(secret, text) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// So sánh không lộ thời gian: băm cả hai rồi so từng byte.
export async function sameText(a, b) {
  const [x, y] = await Promise.all([a, b].map((s) => crypto.subtle.digest("SHA-256", enc.encode(String(s)))));
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < u.length; i++) diff |= u[i] ^ v[i];
  return diff === 0;
}

export async function newSessionCookie(secret, secure) {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  const value = `${exp}.${await sign(secret, exp)}`;
  return `${COOKIE}=${value}; Path=/api/quan-tri; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}${secure ? "; Secure" : ""}`;
}

export const clearCookie = (secure) => `${COOKIE}=; Path=/api/quan-tri; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`;

export async function validSession(request, secret) {
  if (!secret) return false;
  const m = (request.headers.get("Cookie") || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [exp, sig] = m[1].split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return sameText(sig, await sign(secret, exp));
}
