// Hàm dùng chung cho kiểm thử e2e.
import { execFileSync } from "node:child_process";
import { expect } from "@playwright/test";

export const GOC = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
export const MAT_KHAU = process.env.MAT_KHAU_TAI_KHOAN_THU || "ThoToi-ThuNghiem-2026";
/** Vị trí trong vùng phục vụ (bản đồ giả lập) */
export const TRONG_VUNG = { latitude: 21.0325, longitude: 105.79 };

/** Đăng nhập Payload trong context trình duyệt (cookie payload-token). Payload cần header Origin để nhận cookie. */
export async function dangNhap(context, email) {
  const r = await context.request.post(`${GOC}/api/users/login`, {
    data: { email, password: MAT_KHAU }, headers: { Origin: GOC },
  });
  expect(r.ok(), `đăng nhập ${email}`).toBeTruthy();
  return (await r.json()).token;
}

/** Tạo bộ đơn thử ở mọi trạng thái (scripts/tao-don-thu.mjs). */
export function taoDonThu() {
  const out = execFileSync("node", ["scripts/tao-don-thu.mjs", "--json"], { env: { ...process.env, BASE_URL: GOC }, encoding: "utf8" });
  return JSON.parse(out);
}

/** Đường dẫn tương đối từ link tuyệt đối. */
export const duongDan = (link) => new URL(link).pathname;

/** Trang không được cuộn ngang. */
export async function khongCuonNgang(page) {
  const rong = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(rong[0], "chiều rộng nội dung không vượt khung").toBeLessThanOrEqual(rong[1]);
}

/** IP giả cho mỗi lần chạy: server giới hạn 5 đơn/10 phút mỗi IP (đọc X-Forwarded-For như sau proxy). */
const r = () => Math.floor(Math.random() * 250) + 1;
export const IP_GIA = { "X-Forwarded-For": `10.${r()}.${r()}.${r()}` };

/** Số điện thoại di động ngẫu nhiên (server giới hạn 3 đơn/30 phút mỗi số). */
export const sdtNgauNhien = () => `09${String(Date.now()).slice(-8)}`;

/** Đi hết 4 bước đặt lịch. Trả về mã đơn. tuyChon.ma: mã giới thiệu/khuyến mãi đã có sẵn trong ô (từ ?ma=). */
export async function datLichDu4Buoc(page, { url = "/dat-lich/?dv=ac-quy", sdt = sdtNgauNhien(), kiemMa } = {}) {
  await page.goto(url, { waitUntil: "load" });
  await expect(page.locator("h1")).toHaveCount(1);
  // Bước 1: dịch vụ đã chọn sẵn từ ?dv=
  await expect(page.locator('[data-dich-vu="ac-quy"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/triệu/).first()).toBeVisible();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  // Bước 2: xe
  await page.locator("#xe-hang").selectOption("toyota");
  await page.locator("#xe-dong").selectOption("toyota-vios");
  await page.locator("#xe-doi").selectOption("2019");
  await page.locator("#bien-so").fill("30a12345");
  await page.locator("#bien-so").blur();
  await expect(page.locator("#bien-so")).toHaveValue("30A-123.45");
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  // Bước 3: vị trí
  await page.getByRole("button", { name: "Lấy vị trí hiện tại" }).click();
  await expect(page.getByText("Trong vùng phục vụ").first()).toBeVisible();
  await page.getByRole("button", { name: "Hầm chung cư" }).click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  // Bước 4: giờ, liên hệ, đồng ý
  await page.locator("#nhom-khung-gio button:not([disabled])").last().click();
  await page.locator("#ho-ten").fill("Khách Kiểm Thử");
  await page.locator("#sdt").fill(sdt);
  if (kiemMa) await kiemMa(page);
  // Chưa tích đồng ý thì không gửi được
  await page.getByRole("button", { name: "Gửi yêu cầu" }).click();
  await expect(page.getByText(/Bạn cần tích ô đồng ý/).first()).toBeVisible();
  await page.locator("#dongY").check();
  await page.getByRole("button", { name: "Gửi yêu cầu" }).click();
  await expect(page.getByText("Đã nhận yêu cầu").first()).toBeVisible({ timeout: 20_000 });
  const ma = (await page.locator("[data-ma-don]").textContent()).trim();
  expect(ma).toMatch(/^TT-\d+/);
  await expect(page.getByRole("link", { name: "Theo dõi đơn" })).toHaveAttribute("href", /\/don\/[\w-]+\/$/);
  return ma;
}

