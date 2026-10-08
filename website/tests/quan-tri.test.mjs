// Kiểm tra API trang quản trị với GitHub và Cloudflare Access giả lập. Chạy: npm test
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { onRequest as middleware } from "../functions/api/quan-tri/_middleware.js";
import { onRequestGet as tongQuan } from "../functions/api/quan-tri/tong-quan.js";
import { onRequestPost as chay } from "../functions/api/quan-tri/chay.js";
import { onRequestGet as xemPR, onRequestPost as xuLyPR } from "../functions/api/quan-tri/pr/[so].js";

const TEAM = "vcpv.cloudflareaccess.com";
const AUD = "aud-123";
const env = {
  ACCESS_TEAM_DOMAIN: TEAM,
  ACCESS_AUD: AUD,
  ADMIN_EMAILS: "admin@vc.vn",
  REVIEWER_EMAILS: "duyet@vc.vn, khac@vc.vn",
  GITHUB_TOKEN: "t",
  GITHUB_REPO: "o/r",
};

const { publicKey, privateKey } = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"],
);
const jwk = { ...(await crypto.subtle.exportKey("jwk", publicKey)), kid: "k1" };
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
async function token(email, over = {}) {
  const h = b64({ alg: "RS256", kid: "k1" });
  const p = b64({ email, aud: [AUD], iss: `https://${TEAM}`, exp: Date.now() / 1000 + 600, ...over });
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${Buffer.from(sig).toString("base64url")}`;
}

// GitHub giả: state đổi theo từng test; calls ghi lại các lệnh ghi.
let state, calls;
const plan = (bai) => JSON.stringify({ lichDang: [{ thang: "2026-11", baiCamNang: 2 }], nhomTuKhoa: [], baiKeHoach: bai });
const prBai = { number: 7, title: "Bài mới: Má phanh", body: "Bảng nguồn", state: "open", mergeable: true, updated_at: "x", html_url: "u",
  head: { ref: "bai/ma-phanh", sha: "s7", repo: { full_name: "o/r" } }, base: { ref: "main", sha: "b0", repo: { full_name: "o/r" } } };
const prKH = { ...prBai, number: 9, title: "Kế hoạch SEO 2026-11", head: { ref: "ke-hoach/2026-11", sha: "s9", repo: { full_name: "o/r" } } };

beforeEach(() => {
  calls = [];
  state = {
    pulls: { 7: prBai, 9: prKH },
    files: { 7: [{ filename: "website/content/cam-nang/ma-phanh.md", status: "added" }], 9: [{ filename: "website/content/ke-hoach-seo.json", status: "modified" }] },
    checks: [{ name: "build", status: "completed", conclusion: "success" }],
    runs: [{ display_title: "sua-bai #7 – a", status: "completed", conclusion: "success", created_at: "t", html_url: "r" }],
    plans: {
      main: plan([{ thang: "2026-10", slug: "cu", tuKhoa: "cũ" }, { thang: "2026-11", slug: "ma-phanh", tuKhoa: "má phanh" }, { thang: "2026-11", slug: "dieu-hoa", tuKhoa: "điều hoà" }]),
      b0: plan([{ thang: "2026-10", slug: "cu", tuKhoa: "cũ" }]),
      s9: plan([{ thang: "2026-10", slug: "cu", tuKhoa: "cũ" }, { thang: "2026-11", slug: "lop", tuKhoa: "lốp" }]),
    },
  };
});

globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url);
  const method = init.method || "GET";
  const ok = (data, status = 200) => new Response(typeof data === "string" ? data : JSON.stringify(data), { status });
  if (u.host === TEAM) return ok({ keys: [jwk] });
  const path = u.pathname.replace("/repos/o/r", "");
  if (method !== "GET") {
    calls.push({ method, path, body: init.body ? JSON.parse(init.body) : null });
    return method === "DELETE" || path.endsWith("/dispatches") ? new Response(null, { status: 204 }) : ok({});
  }
  if (path === "/pulls") return ok(Object.values(state.pulls));
  let m;
  if ((m = path.match(/^\/pulls\/(\d+)$/))) return state.pulls[m[1]] ? ok(state.pulls[m[1]]) : ok({ message: "Not Found" }, 404);
  if ((m = path.match(/^\/pulls\/(\d+)\/files$/))) return ok(state.files[m[1]]);
  if (path.match(/^\/issues\/\d+\/comments$/)) return ok([{ user: { login: "bot" }, created_at: "t", body: "Preview: https://abc.vc-mobile-care.pages.dev" }]);
  if (path.match(/^\/commits\/\w+\/check-runs$/)) return ok({ check_runs: state.checks });
  if (path.endsWith("/runs")) return ok({ workflow_runs: state.runs });
  if (path.startsWith("/compare/")) return ok({ merge_base_commit: { sha: "b0" } });
  if (path === "/contents/website/content/cam-nang") return ok([{ name: "cu.md" }]);
  if (path === "/contents/website/content/ke-hoach-seo.json") return ok(state.plans[u.searchParams.get("ref")]);
  if (path === "/contents/website/content/cam-nang/ma-phanh.md") return ok("---\ntitle: Má phanh\n---\nNội dung");
  throw new Error(`fetch chưa giả lập: ${method} ${url}`);
};

async function goi(handler, { email = "admin@vc.vn", method = "GET", body, params = {}, header = true, tok } = {}) {
  const headers = { "cf-access-jwt-assertion": tok ?? (await token(email)) };
  if (header) headers["x-quan-tri"] = "1";
  const request = new Request("https://x.pages.dev/api/quan-tri/", { method, headers, body: body ? JSON.stringify(body) : undefined });
  const ctx = { request, env, params, data: {} };
  ctx.next = () => handler(ctx);
  const res = await middleware(ctx);
  return { status: res.status, json: await res.json() };
}

test("đăng nhập: chữ ký sai, sai aud, hết hạn, email lạ đều bị chặn", async () => {
  const good = await token("admin@vc.vn");
  assert.equal((await goi(tongQuan, { tok: good.slice(0, -4) + "AAAA" })).status, 401);
  assert.equal((await goi(tongQuan, { tok: await token("admin@vc.vn", { aud: ["khac"] }) })).status, 401);
  assert.equal((await goi(tongQuan, { tok: await token("admin@vc.vn", { exp: 1 }) })).status, 401);
  assert.equal((await goi(tongQuan, { tok: "" })).status, 401);
  const la = await goi(tongQuan, { email: "la@x.vn" });
  assert.equal(la.status, 403);
  const r = await goi(tongQuan, { email: "DUYET@vc.vn" });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.toi, { email: "duyet@vc.vn", vaiTro: "duyet-bai" });
});

test("tổng quan: trạng thái từng bài trong kế hoạch", async () => {
  state.runs.push({ display_title: "viet-bai dieu-hoa – admin@vc.vn", status: "in_progress", created_at: "t", html_url: "r" });
  const { json } = await goi(tongQuan);
  const tt = Object.fromEntries(json.baiKeHoach.map((b) => [b.slug, b.trangThai]));
  assert.deepEqual(tt, { cu: "da-dang", "ma-phanh": "cho-duyet", "dieu-hoa": "dang-viet" });
  assert.deepEqual(json.keHoachPR.map((p) => p.thang), ["2026-11"]);
  assert.deepEqual(json.baiPR.map((p) => p.slug), ["ma-phanh"]);
});

test("xem bài và kế hoạch", async () => {
  const bai = (await goi(xemPR, { params: { so: "7" } })).json;
  assert.equal(bai.bai.noiDung.includes("Nội dung"), true);
  assert.equal(bai.xemTruoc, "https://abc.vc-mobile-care.pages.dev");
  assert.deepEqual(bai.fileSai, []);
  const kh = (await goi(xemPR, { params: { so: "9" } })).json;
  assert.deepEqual(kh.keHoach.muc.map((b) => [b.slug, b.thayDoi]), [["lop", "moi"]]);
  assert.equal(kh.keHoach.suaNgoaiThang, false);
});

test("lệnh ghi phải có header x-quan-tri", async () => {
  const r = await goi(xuLyPR, { method: "POST", header: false, params: { so: "7" }, body: { hanhDong: "duyet", sha: "s7" } });
  assert.equal(r.status, 403);
  assert.equal(calls.length, 0);
});

test("duyệt bài: merge đúng bản đã đọc, ký tên người duyệt, xoá nhánh", async () => {
  const cu = await goi(xuLyPR, { email: "duyet@vc.vn", method: "POST", params: { so: "7" }, body: { hanhDong: "duyet", sha: "cu" } });
  assert.equal(cu.status, 409);
  const r = await goi(xuLyPR, { email: "duyet@vc.vn", method: "POST", params: { so: "7" }, body: { hanhDong: "duyet", sha: "s7" } });
  assert.equal(r.status, 200);
  assert.match(calls[0].body.body, /duyet@vc\.vn/);
  assert.deepEqual([calls[1].method, calls[1].path, calls[1].body.sha], ["PUT", "/pulls/7/merge", "s7"]);
  assert.deepEqual([calls[2].method, calls[2].path], ["DELETE", "/git/refs/heads/bai/ma-phanh"]);
});

test("không duyệt khi PR đổi file ngoài phạm vi hoặc kiểm tra lỗi", async () => {
  state.files[7].push({ filename: "website/app/page.jsx", status: "modified" });
  assert.equal((await goi(xuLyPR, { method: "POST", params: { so: "7" }, body: { hanhDong: "duyet", sha: "s7" } })).status, 409);
  state.files[7].pop();
  state.checks = [{ name: "build", status: "completed", conclusion: "failure" }];
  assert.equal((await goi(xuLyPR, { method: "POST", params: { so: "7" }, body: { hanhDong: "duyet", sha: "s7" } })).status, 409);
  assert.equal(calls.length, 0);
});

test("kế hoạch: người duyệt bài không được duyệt; kế hoạch sửa tháng khác bị chặn", async () => {
  assert.equal((await goi(xuLyPR, { email: "duyet@vc.vn", method: "POST", params: { so: "9" }, body: { hanhDong: "duyet", sha: "s9" } })).status, 403);
  state.plans.s9 = plan([{ thang: "2026-10", slug: "cu", tuKhoa: "đổi" }, { thang: "2026-11", slug: "lop", tuKhoa: "lốp" }]);
  const r = await goi(xuLyPR, { method: "POST", params: { so: "9" }, body: { hanhDong: "duyet", sha: "s9" } });
  assert.equal(r.status, 409);
  assert.match(r.json.loi, /tháng khác/);
});

test("yêu cầu sửa: cần góp ý, gửi việc cho AI", async () => {
  assert.equal((await goi(xuLyPR, { method: "POST", params: { so: "7" }, body: { hanhDong: "yeu-cau-sua", gopY: " " } })).status, 400);
  const r = await goi(xuLyPR, { email: "duyet@vc.vn", method: "POST", params: { so: "7" }, body: { hanhDong: "yeu-cau-sua", gopY: "Mở bài ngắn lại" } });
  assert.equal(r.status, 200);
  const d = calls.find((c) => c.path.endsWith("/dispatches"));
  assert.deepEqual(d.body, { ref: "main", inputs: { viec: "sua-bai", pr: "7", gop_y: "Mở bài ngắn lại", nguoi: "duyet@vc.vn" } });
});

test("ra lệnh cho AI: chỉ quản trị; slug phải có trong kế hoạch đã duyệt", async () => {
  assert.equal((await goi(chay, { email: "duyet@vc.vn", method: "POST", body: { viec: "lap-ke-hoach", thang: "2026-12" } })).status, 403);
  assert.equal((await goi(chay, { method: "POST", body: { viec: "lap-ke-hoach", thang: "2026-13" } })).status, 400);
  assert.equal((await goi(chay, { method: "POST", body: { viec: "viet-bai", slugs: ["khong-co"] } })).status, 400);
  const r = await goi(chay, { method: "POST", body: { viec: "viet-bai", slugs: ["dieu-hoa", "ma-phanh"] } });
  assert.deepEqual(r.json, { ok: true, soLuot: 2 });
  assert.deepEqual(calls.map((c) => c.body.inputs.slug), ["dieu-hoa", "ma-phanh"]);
});
