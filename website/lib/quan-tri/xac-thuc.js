// Xác thực người dùng trang quản trị qua Cloudflare Access.
// Access chặn người lạ trước khi tới đây; hàm này kiểm lại chữ ký JWT Access gắn vào mỗi request
// để header không thể bị giả nếu Access bị cấu hình sai, rồi phân quyền theo danh sách email.

export class LoiHttp extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const enc = new TextEncoder();
let cache = { at: 0, keys: [] };

function b64urlBytes(s) {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}
const b64urlJson = (s) => JSON.parse(new TextDecoder().decode(b64urlBytes(s)));

function teamUrl(env) {
  const d = String(env.ACCESS_TEAM_DOMAIN || "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!d) throw new LoiHttp(500, "Chưa cấu hình ACCESS_TEAM_DOMAIN");
  return `https://${d}`;
}

async function keys(env, refresh) {
  if (!refresh && cache.keys.length && Date.now() - cache.at < 3600_000) return cache.keys;
  const res = await fetch(`${teamUrl(env)}/cdn-cgi/access/certs`);
  if (!res.ok) throw new LoiHttp(502, "Không lấy được khoá của Cloudflare Access");
  cache = { at: Date.now(), keys: (await res.json()).keys || [] };
  return cache.keys;
}

export async function xacThuc(request, env) {
  if (!env.ACCESS_AUD) throw new LoiHttp(500, "Chưa cấu hình ACCESS_AUD");
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) throw new LoiHttp(401, "Chưa đăng nhập");
  const [h, p, s] = token.split(".");
  if (!s) throw new LoiHttp(401, "Phiên đăng nhập không hợp lệ");
  let header, payload;
  try {
    header = b64urlJson(h);
    payload = b64urlJson(p);
  } catch {
    throw new LoiHttp(401, "Phiên đăng nhập không hợp lệ");
  }
  if (header.alg !== "RS256") throw new LoiHttp(401, "Phiên đăng nhập không hợp lệ");

  let jwk = (await keys(env)).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await keys(env, true)).find((k) => k.kid === header.kid);
  if (!jwk) throw new LoiHttp(401, "Phiên đăng nhập không hợp lệ");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlBytes(s), enc.encode(`${h}.${p}`));
  if (!ok) throw new LoiHttp(401, "Phiên đăng nhập không hợp lệ");

  const now = Date.now() / 1000;
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (payload.iss !== teamUrl(env) || !aud.includes(env.ACCESS_AUD)) throw new LoiHttp(401, "Phiên đăng nhập không hợp lệ");
  if (!(payload.exp > now) || (payload.nbf && payload.nbf > now + 60)) throw new LoiHttp(401, "Phiên đăng nhập đã hết hạn, tải lại trang");
  if (!payload.email) throw new LoiHttp(401, "Phiên đăng nhập không có email");

  const email = String(payload.email).toLowerCase();
  const list = (v) => String(v || "").toLowerCase().split(/[\s,;]+/).filter(Boolean);
  const vaiTro = list(env.ADMIN_EMAILS).includes(email) ? "quan-tri" : list(env.REVIEWER_EMAILS).includes(email) ? "duyet-bai" : null;
  if (!vaiTro) throw new LoiHttp(403, `Email ${email} chưa được cấp quyền vào trang quản trị`);
  return { email, vaiTro };
}

export function canQuanTri(user) {
  if (user.vaiTro !== "quan-tri") throw new LoiHttp(403, "Chỉ quản trị viên được làm việc này");
}
