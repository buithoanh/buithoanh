// Quản trị: sửa giá thấy ngay ở trang dịch vụ, trang khu vực, form đặt lịch; Biên tập không vào được màn bảng giá;
// tạo mã khuyến mãi rồi dùng khi đặt lịch. Mọi thay đổi trên dữ liệu được trả lại như cũ cuối mỗi ca.
import { test, expect } from "@playwright/test";
import { GOC, IP_GIA, TRONG_VUNG, dangNhap, datLichDu4Buoc } from "./chung.mjs";

test.use({ viewport: { width: 1440, height: 900 } });

const HANG_MUC = "Công thay ắc quy";
const tien = (n) => `${n.toLocaleString("vi-VN").replace(/,/g, ".")}đ`;

async function suaGia(page, gia, lyDo) {
  await page.goto("/quan-tri/bang-gia/");
  await page.getByRole("tab", { name: /^Ắc quy/ }).click();
  const o = page.getByLabel(`Giá công ${HANG_MUC}`, { exact: true });
  await o.fill(String(gia));
  await page.getByLabel("Lý do đổi giá (ghi vào nhật ký)").fill(lyDo);
  await page.getByRole("button", { name: /^Lưu 1 thay đổi giá/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã lưu 1 thay đổi giá" })).toBeVisible();
}

test("chưa đăng nhập thì chuyển sang trang đăng nhập", async ({ page }) => {
  await page.goto("/quan-tri/bang-gia/");
  await expect(page).toHaveURL(/\/admin\/login\?redirect=/);
});

test("Quản lý dịch vụ sửa giá: trang dịch vụ, trang khu vực, form đặt lịch đổi theo", async ({ page, context, request }) => {
  const bg = await (await request.get("/api/trang/dich-vu/ac-quy")).json();
  const tim = (x) => (Array.isArray(x) ? x.flatMap(tim) : x && typeof x === "object" ? (x.ten === HANG_MUC && typeof x.gia === "object" ? [x.gia.tu] : Object.values(x).flatMap(tim)) : []);
  const giaCu = tim(bg)[0];
  expect(giaCu, `tìm được giá hiện tại của "${HANG_MUC}"`).toBeGreaterThan(0);
  const giaMoi = giaCu + 20000;

  await dangNhap(context, "quanly@thotoi.test");
  // Thiếu lý do thì không lưu
  await page.goto("/quan-tri/bang-gia/");
  await page.getByRole("tab", { name: /^Ắc quy/ }).click();
  await page.getByLabel(`Giá công ${HANG_MUC}`, { exact: true }).fill(String(giaMoi));
  await page.getByRole("button", { name: /^Lưu 1 thay đổi giá/ }).click();
  await expect(page.locator("#loi-ly-do")).toBeVisible();

  await suaGia(page, giaMoi, "Kiểm thử e2e: tăng giá công");
  try {
    await page.goto("/dich-vu/ac-quy/");
    await expect(page.getByText(tien(giaMoi)).first()).toBeVisible();
    // Trang khu vực mẫu đang là bản nháp: xem qua chế độ xem trước (đã đăng nhập), cùng component với trang đã đăng
    await page.goto(`/xem-truoc/?loai=khu-vuc&slug=ac-quy-thanh-xuan`);
    await expect(page).toHaveURL(/\/dich-vu\/ac-quy\/[\w-]+\/$/);
    await expect(page.getByText(tien(giaMoi)).first()).toBeVisible();
    await page.goto("/xem-truoc/thoat/");
    // Form đặt lịch: giá sơ bộ tính lại từ bảng giá (gồm tiền công vừa sửa)
    const bao = await (await request.post("/api/bao-gia-so-bo", { data: { dichVu: ["ac-quy"], dongXe: "toyota-vios" } })).json();
    expect(bao.dong.find((d) => d.ten === HANG_MUC)?.tu).toBe(giaMoi);
    await page.goto("/dat-lich/?dv=ac-quy&hang=toyota&dong=toyota-vios", { waitUntil: "load" });
    await expect(page.getByText(bao.hienThi).first()).toBeVisible();
  } finally {
    await suaGia(page, giaCu, "Kiểm thử e2e: trả lại giá cũ");
  }
  await page.goto("/quan-tri/bang-gia/?tab=nhat-ky");
  await expect(page.getByText("Kiểm thử e2e: trả lại giá cũ").first()).toBeVisible();
});

test("Biên tập không vào được màn bảng giá và không thấy mục đó trong menu", async ({ page, context }) => {
  await dangNhap(context, "bientap@thotoi.test");
  await page.goto("/quan-tri/bai-viet/");
  const menu = page.getByRole("navigation", { name: "Menu quản trị" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link", { name: /Bảng giá/ })).toHaveCount(0);
  await page.goto("/quan-tri/bang-gia/");
  await expect(page.locator("h1")).toContainText(/không có quyền/i);
  await expect(page.getByRole("button", { name: /^Lưu/ })).toHaveCount(0);
  // Backend cũng chặn
  const r = await context.request.patch(`${GOC}/api/globals/bang-gia-chung`, { data: { phiDiLai: 1 }, headers: { Origin: GOC } });
  expect(r.status()).toBeGreaterThanOrEqual(401);
});

test.describe("mã khuyến mãi", () => {
  test.use({ geolocation: TRONG_VUNG, permissions: ["geolocation"] });

  test("Marketing tạo mã cây xăng, khách dùng mã khi đặt lịch", async ({ page, context, browser }) => {
    await dangNhap(context, "marketing@thotoi.test");
    await page.goto("/quan-tri/ma-khuyen-mai/");
    const doiTac = `Cây xăng kiểm thử ${Date.now() % 100000}`;
    await page.getByLabel("Tên đối tác").fill(doiTac);
    const ma = (await page.getByLabel("Mã khách nhập").inputValue()).trim();
    expect(ma).toMatch(/^XANG-/);
    await page.getByRole("button", { name: "Tạo mã và QR" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Đã tạo mã" })).toBeVisible();
    await expect(page.locator("#the-qr img")).toBeVisible();

    try {
      // Khách (phiên khác, chưa đăng nhập) mở link có ?ma=, mã điền sẵn và được áp
      const khach = await browser.newContext({ viewport: { width: 390, height: 844 }, geolocation: TRONG_VUNG, permissions: ["geolocation"], baseURL: GOC, extraHTTPHeaders: IP_GIA });
      const p = await khach.newPage();
      await datLichDu4Buoc(p, {
        url: `/dat-lich/?dv=ac-quy&ma=${ma}`,
        kiemMa: async (pg) => { await expect(pg.locator("#ma-gt")).toHaveValue(ma); },
      });
      await expect(p.getByText(ma).first()).toBeVisible();
      await khach.close();
    } finally {
      const tk = await dangNhap(context, "quantri@thotoi.test");
      const ds = await (await context.request.get(`${GOC}/api/ma-khuyen-mai?where[ma][equals]=${ma}&depth=0`, { headers: { Authorization: `JWT ${tk}` } })).json();
      for (const d of ds.docs || []) await context.request.delete(`${GOC}/api/ma-khuyen-mai/${d.id}`, { headers: { Authorization: `JWT ${tk}` } });
    }
  });
});
