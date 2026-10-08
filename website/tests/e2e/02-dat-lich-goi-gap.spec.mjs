// Đặt lịch đủ 4 bước và gọi thợ gấp (bản đồ giả lập: toạ độ TRONG_VUNG nằm trong vùng phục vụ).
import { test, expect } from "@playwright/test";
import { TRONG_VUNG, datLichDu4Buoc, khongCuonNgang, sdtNgauNhien } from "./chung.mjs";

test.use({ geolocation: TRONG_VUNG, permissions: ["geolocation"] });

test("đặt lịch đủ 4 bước, có giá sơ bộ, mở được link theo dõi", async ({ page }) => {
  await datLichDu4Buoc(page);
  await khongCuonNgang(page);
  await page.getByRole("link", { name: "Theo dõi đơn" }).click();
  await expect(page).toHaveURL(/\/don\/[\w-]+\/$/);
  await expect(page.getByText(/TT-\d+/).first()).toBeVisible();
});

test("gọi thợ gấp: chọn sự cố, lấy vị trí, gửi", async ({ page }) => {
  await page.goto("/goi-gap/", { waitUntil: "load" });
  await page.locator("[data-su-co]").first().click();
  await page.getByRole("button", { name: "Lấy vị trí của xe" }).click();
  await expect(page.getByText("Trong vùng phục vụ").first()).toBeVisible();
  await page.locator("#sdt-gap").fill(sdtNgauNhien());
  await page.locator("#dongY-gap").check();
  const nut = page.getByRole("button", { name: "Gửi yêu cầu khẩn cấp" });
  if (await page.getByText(/ngoài giờ nhận/i).count()) {
    // Ngoài giờ nhận gấp (mặc định 06:00–22:00): nút khoá, có hotline
    await expect(nut).toBeDisabled();
    test.info().annotations.push({ type: "ghi chú", description: "Chạy ngoài giờ nhận gấp: chỉ kiểm tra nút bị khoá." });
    return;
  }
  await nut.click();
  await expect(page.getByText("Đã nhận").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-ma-don]")).toHaveText(/TT-\d+/);
});
