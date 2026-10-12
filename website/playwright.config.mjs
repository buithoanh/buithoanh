// Kiểm thử end-to-end (Playwright). Chạy với server đã build + dữ liệu mẫu:
//   npm run migrate && npm run nap-du-lieu && npm run build && npm start   (cửa sổ khác)
//   npm run test:e2e
// Đặt BASE_URL nếu server không ở http://localhost:3000.
import { defineConfig, devices } from "@playwright/test";
import { IP_GIA } from "./tests/e2e/chung.mjs";

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/chuan-bi.mjs",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]] : "list",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    locale: "vi-VN",
    extraHTTPHeaders: IP_GIA,
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "dien-thoai", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: false } },
  ],
});
