// Trang chủ, bảng giá, dịch vụ trên khổ điện thoại 390px và máy tính 1440px.
import { test, expect } from "@playwright/test";
import { khongCuonNgang } from "./chung.mjs";

for (const rong of [390, 1440]) {
  test.describe(`khổ ${rong}px`, () => {
    test.use({ viewport: { width: rong, height: rong === 390 ? 844 : 900 } });

    test("trang chủ: một h1, dịch vụ, bảng giá tóm tắt, khu vực từ dữ liệu", async ({ page }) => {
      const r = await page.goto("/");
      expect(r.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByRole("heading", { name: "Bảng giá tóm tắt" })).toBeVisible();
      await expect(page.getByText("Phí đi lại nội thành").first()).toBeVisible();
      await expect(page.getByRole("heading", { name: "Khu vực phục vụ" }).first()).toBeVisible();
      const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(ld.join(" ")).toContain("AutoRepair");
      await khongCuonNgang(page);
      if (rong === 390) {
        await expect(page.getByRole("navigation", { name: "Liên hệ nhanh" })).toBeVisible();
      } else {
        await expect(page.getByRole("navigation", { name: "Menu chính" })).toBeVisible();
        await expect(page.getByText("Xem giá cho xe của bạn")).toBeVisible();
      }
    });

    test("bảng giá: đổi phân khúc thì giá phụ tùng đổi theo", async ({ page }) => {
      await page.goto("/bang-gia/");
      await expect(page.locator("h1")).toHaveCount(1);
      const o = page.locator("#gia-bao-duong-dinh-ky td").nth(2);
      const truoc = (await o.textContent()).trim();
      await page.getByRole("radio", { name: /^D/ }).click();
      await expect(o).not.toHaveText(truoc);
      await expect(page).toHaveURL(/phanKhuc=D/);
      await khongCuonNgang(page);
    });
  });
}

test("ô kiểm tra khu vực trên trang chủ trả lời theo dữ liệu vùng", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Xe bạn đang ở đâu?").fill("18 Trần Thái Tông, Cầu Giấy");
  await page.getByRole("button", { name: "Kiểm tra" }).click();
  await expect(page.locator(".bao-ok")).toContainText("Trong vùng phục vụ");
});

test("trang dịch vụ có FAQPage, giá theo xe và nút đặt lịch", async ({ page }) => {
  await page.goto("/dich-vu/ac-quy/");
  await expect(page.locator("h1")).toHaveCount(1);
  expect((await page.locator('script[type="application/ld+json"]').allTextContents()).join(" ")).toContain("FAQPage");
  // Khối xem giá chỉ tải danh sách xe khi cuộn tới
  await page.getByText("Xem giá cho xe của bạn").first().scrollIntoViewIfNeeded();
  await expect(page.locator("#xem-gia-ac-quy-hang option[value=toyota]")).toHaveCount(1);
  await page.locator("#xem-gia-ac-quy-hang").selectOption("toyota");
  await page.locator("#xem-gia-ac-quy-dong").selectOption("toyota-vios");
  await expect(page.getByRole("status").filter({ hasText: "triệu" }).first()).toBeVisible();
  await expect(page.locator('a[href^="/dat-lich/?dv=ac-quy"]').first()).toBeVisible();
});

test("đường dẫn không có trả 404 với trang lỗi", async ({ page }) => {
  const r = await page.goto("/khong-co-trang-nay/");
  expect(r.status()).toBe(404);
  await expect(page.locator("h1")).toContainText("Trang này không còn ở đây");
});
