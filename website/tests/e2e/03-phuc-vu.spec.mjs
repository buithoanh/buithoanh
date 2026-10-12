// Sau khi đặt: duyệt báo giá bỏ bớt hạng mục, thanh toán VietQR (ngân hàng giả lập), đánh giá 2 sao mở khiếu nại,
// tra cứu lịch sử xe bằng mã giả lập. Dữ liệu: scripts/tao-don-thu.mjs (9 đơn ở các trạng thái).
import { test, expect } from "@playwright/test";
import { duongDan, khongCuonNgang, taoDonThu } from "./chung.mjs";

let du;
test.beforeAll(() => { du = taoDonThu(); });

test("theo dõi: thợ đang đến, có nút gọi tổng đài", async ({ page }) => {
  await page.goto(duongDan(du.don.thoDangDen.link));
  await expect(page.getByText(/Thợ đang đến/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Gọi tổng đài/ }).first()).toBeVisible();
  await khongCuonNgang(page);
});

test("duyệt báo giá, bỏ bớt hạng mục không bắt buộc", async ({ page }) => {
  await page.goto(duongDan(du.don.choDuyet.link));
  await page.getByRole("button", { name: "Bỏ hạng mục Thay lưỡi gạt mưa" }).click();
  const nutDongY = page.getByRole("button", { name: /^Đồng ý/ });
  await expect(nutDongY).toContainText("1.970.000đ");
  await nutDongY.click();
  await expect(page.getByText("Tích ô đồng ý báo giá trước khi bấm.")).toBeVisible();
  await page.getByLabel(/Tôi đồng ý báo giá/).check();
  await nutDongY.click();
  await expect(page.getByRole("heading", { name: "Đã duyệt báo giá" })).toBeVisible();
});

test("thanh toán VietQR: sao chép, tiền về thì tự chuyển sang biên nhận", async ({ page, context, request }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(duongDan(du.don.choThanhToan.link));
  await expect(page.locator("img[alt*='QR'], svg[aria-label*='QR']").first()).toBeVisible();
  await page.getByRole("button", { name: "Sao chép số tài khoản" }).click();
  await expect(page.getByRole("button", { name: "Sao chép số tài khoản" })).toContainText("Đã chép");
  const r = await request.post(du.giaLapTienVe);
  expect(r.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: /Biên nhận/ })).toBeVisible({ timeout: 20_000 });
});

test("đánh giá 2 sao tạo phiếu khiếu nại, link dùng một lần", async ({ page }) => {
  await page.goto(duongDan(du.don.danhGiaKem.link));
  await page.getByText("2 sao – Chưa tốt").click({ force: true });
  await page.getByRole("button", { name: "Thợ đến trễ" }).click();
  await page.getByLabel("Mô tả thêm").fill("Hẹn 9 giờ, 10 giờ thợ mới tới (kiểm thử).");
  await page.getByRole("button", { name: "Gửi góp ý" }).click();
  await expect(page.getByText(/Đã chuyển CSKH/).first()).toBeVisible();
  await expect(page.getByText(/KN-\d+/).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /Bạn đã đánh giá đơn này/ })).toBeVisible();
});

test("tra cứu lịch sử xe: biển số → mã Zalo (giả lập) → lịch sử", async ({ page }) => {
  await page.goto("/tra-cuu-xe/");
  await page.getByLabel("Biển số xe").fill(du.bienSo);
  const [phanHoi] = await Promise.all([
    page.waitForResponse(/tra-cuu-xe\/gui-ma/),
    page.getByRole("button", { name: "Gửi mã xác nhận qua Zalo" }).click(),
  ]);
  const { maGiaLap } = await phanHoi.json();
  expect(maGiaLap, "máy kiểm thử phải chạy tin nhắn giả lập").toMatch(/^\d{6}$/);
  // Mã sai báo lỗi cạnh ô
  await page.getByLabel("Mã xác nhận 6 số").fill(maGiaLap === "000000" ? "111111" : "000000");
  await page.getByRole("button", { name: "Xem lịch sử xe" }).click();
  await expect(page.locator('[role="alert"]').filter({ hasText: /mã|Mã/ }).first()).toBeVisible();
  await page.getByLabel("Mã xác nhận 6 số").fill(maGiaLap);
  await page.getByRole("button", { name: "Xem lịch sử xe" }).click();
  await expect(page.getByRole("heading", { name: "Các lần sửa" })).toBeVisible();
});

test("link sai và link hết hạn hiện màn báo gọn", async ({ page }) => {
  await page.goto(duongDan(du.linkSai));
  await expect(page.getByRole("heading", { name: "Link không đúng" })).toBeVisible();
  await page.goto(duongDan(du.don.hetHan.link));
  await expect(page.getByRole("heading", { name: "Link đã hết hạn" })).toBeVisible();
});
