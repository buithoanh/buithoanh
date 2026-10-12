# Website VC Mobile Care

Website dịch vụ sửa ô tô tận nơi, slogan "Xe dừng đâu, thợ tới đó". Theo mục 3 và 4 của tài liệu "Kế hoạch kinh doanh – Sửa chữa ô tô lưu động (VCservice)".

- Next.js xuất trang tĩnh, chạy trên **Cloudflare Pages** (miễn phí, địa chỉ tạm `https://<tên>.pages.dev`).
- Bài viết là file Markdown trong `content/`. Thêm file, duyệt, merge là bài lên web.
- **Chưa có tên miền thì Google bị chặn lập chỉ mục** (thanh vàng trên đầu trang, `robots.txt` chặn, header `noindex`). Lý do: thứ hạng trên địa chỉ tạm sẽ mất khi đổi tên miền, và hai địa chỉ cùng nội dung bị tính là trùng.

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `site.config.mjs` | Tên, slogan, hotline, Zalo, khu vực phục vụ, địa chỉ web. **Sửa thông tin thương hiệu ở đây.** |
| `content/dich-vu/*.md` | 6 trang dịch vụ (bảo dưỡng, ắc quy, lốp, đọc lỗi, phanh, cứu hộ) |
| `content/cam-nang/*.md` | Bài cẩm nang SEO |
| `content/ke-hoach-seo.json` | Bộ từ khoá và lịch đăng, lấy từ kế hoạch mục 4.1 và 4.2 |
| `scripts/kiem-tra-bai.mjs` | Kiểm tra bài trước khi build: độ dài tiêu đề và mô tả, số chữ, từ khoá, liên kết hỏng, bài có giá chưa duyệt |
| `content/trieu-chung.json` | Danh sách "Xe bạn đang bị gì?" ở trang chủ (tên, mô tả, icon, liên kết tới trang dịch vụ hoặc bài cẩm nang) |
| `content/ky-thuat-vien/*.md` | Hồ sơ kỹ thuật viên (trang `/doi-ngu/`). Xem file mẫu `_mau.md` |
| `app/` | Giao diện: trang chủ, dịch vụ, cẩm nang, đặt lịch, tra cứu lệnh, đội ngũ, sitemap, robots |
| `components/` | Thành phần dùng chung: đầu/chân trang, icon, ô đặt nhanh, thẻ trạng thái lệnh, huy hiệu cam kết |

## Giao diện học từ đâu

| Học từ | Áp dụng ở |
|---|---|
| bTaskee: đặt dịch vụ vài chạm, icon to | Ô đặt nhanh trang chủ; trang đặt lịch 3 bước (chọn dịch vụ → vị trí, giờ → liên hệ) |
| Xanh SM / Grab: màn hình đầu chỉ một việc, biết ai đang tới | "Xe bạn đang ở đâu, cần gì?" + nút lấy vị trí GPS; thẻ KTV, biển số, thời gian dự kiến |
| Điện Máy Xanh: hotline luôn hiện, cam kết dạng huy hiệu | Hotline ở đầu trang, thanh Gọi/Zalo/Đặt lịch ở đáy điện thoại; dải cam kết (sửa trong `camKet` của `site.config.mjs`) |
| Long Châu / Tâm Anh: hồ sơ chuyên gia, bài tư vấn | Trang `/doi-ngu/`; mục "Xe bạn đang bị gì?" và cẩm nang |
| Ahamove / GHN: tra cứu theo mã, dòng thời gian | Trang `/tra-cuu/`: tiếp nhận → đang tới → đang sửa → hoàn tất → đã thanh toán |
| Cake / Timo: sáng, nhiều khoảng trắng, chữ to | Toàn bộ phong cách: nền trắng, chữ xanh than, một màu cam thương hiệu |

Bài cẩm nang tự có mục lục (từ các tiêu đề `##`) và nút chia sẻ. Font Be Vietnam Pro được đóng gói sẵn (gói `@fontsource/be-vietnam-pro`), không gọi Google Fonts khi khách mở trang.

Icon trang và ảnh chia sẻ (`public/og.png`, hiện khi gửi link qua Zalo/Facebook) tạo bằng `scripts/tao-anh.mjs`. Đổi tên, slogan hoặc thành phố thì chạy lại: `npx -y -p playwright@1.56.1 node scripts/tao-anh.mjs`.

Mỗi trang dịch vụ có thêm các trường: `tenNgan` (tên trên ô icon), `icon` (oil, battery, tire, scan, brake, tow…, xem `components/Icon.jsx`), và tuỳ chọn `giaTu` (ví dụ `"350.000đ"`, chỉ hiện khi có `giaDaDuyet: true`).

## Dữ liệu mẫu (giai đoạn phát triển)

Để web trông và chạy như thật trước khi có số liệu, file `mock/du-lieu-mau.mjs` chứa **dữ liệu giả**: hotline, Zalo, email, 6 quận, giá "từ …", 4 kỹ thuật viên (ảnh minh hoạ), 6 đánh giá, số liệu (4,9★, 326 đánh giá…) và 3 lệnh sửa chữa mẫu.

- **Bật** khi chạy thử (mặc định), thanh vàng đầu trang ghi rõ "dữ liệu mẫu".
- **Tự tắt** khi gắn tên miền thật (`ALLOW_INDEX=1`). Bước sau build còn quét lại: trang nào còn sót số/tên mẫu thì build dừng.
- Tắt tay để xem bản "sạch": `DU_LIEU_MAU=0 npm run dev`.
- Dữ liệu thật luôn được ưu tiên: điền hotline trong `site.config.mjs`, hồ sơ trong `content/ky-thuat-vien/`, đánh giá thật trong `content/danh-gia.json` (cùng định dạng mảng `danhGia` trong file mẫu), số liệu thật trong `site.soLieu`.

**API giả:** chưa có `NEXT_PUBLIC_BOOKING_ENDPOINT` / `NEXT_PUBLIC_TRACKING_ENDPOINT` thì `lib/api.js` giả lập ngay trong trình duyệt:

- Đặt lịch → nhận mã `VC-xxxx`, lệnh lưu trong trình duyệt.
- Tra cứu lệnh vừa đặt → trạng thái tự chạy: tiếp nhận (0′) → KTV đang tới (1′) → đang sửa (4′) → hoàn tất (8′) → đã thanh toán (10′). Trang tra cứu tự cập nhật 20 giây/lần.
- Lệnh mẫu có sẵn: `0912345678` / `VC-2401` (đang tới), `0987654321` / `VC-2398` (đang sửa), `0901234567` / `VC-2385` (đã thanh toán).

## Quy trình đăng bài SEO (có duyệt)

```
Agent "SEO Editor" chọn từ khoá trong ke-hoach-seo.json
  → viết content/cam-nang/<slug>.md → tự kiểm tra và build
  → mở pull request "Bài mới: …" trên GitHub
  → GitHub Actions kiểm tra lại; Cloudflare Pages tạo link xem trước của bài
  → người phụ trách đọc bản xem trước → Approve + Merge
  → Cloudflare Pages tự build, bài lên web sau khoảng 1–2 phút
```

Trong Claude Code, ở thư mục repo:

```
Dùng SEO Editor viết bài tuần này
Dùng SEO Editor viết bài cho từ khoá "thay dầu ô tô tại nhà"
```

Agent **không bao giờ tự merge**. Bài có nêu giá phải được người phụ trách xác nhận (trường `giaDaDuyet: true`), nếu không thì không build được.

Muốn bắt buộc duyệt trên GitHub: Settings → Branches → thêm quy tắc cho nhánh `main`, bật "Require a pull request before merging" và "Require status checks" (chọn "Website – kiểm tra bài và build").

## Chạy thử trên máy

```bash
cd website
npm install
npm run dev          # http://localhost:3000
npm run kiem-tra     # chỉ kiểm tra bài
npm run build        # kiểm tra + xuất trang tĩnh ra out/
```

## Đưa lên Cloudflare Pages (làm một lần)

1. Gộp nhánh này vào `main` trên GitHub.
2. Đăng nhập [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → chọn repo `buithoanh/buithoanh`.
3. Cấu hình build:
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `out`
   - Root directory: `website`
   - Biến môi trường: `NODE_VERSION` = `22`, `SITE_URL` = `https://<tên-project>.pages.dev`
4. Bấm **Save and Deploy**. Cloudflare cấp địa chỉ `https://<tên-project>.pages.dev`. Từ đó mỗi lần merge vào `main` là web tự cập nhật, mỗi pull request có link xem trước riêng.

## Khi đã có tên miền

1. Cloudflare Pages → project → **Custom domains** → thêm tên miền (ví dụ `vcmobilecare.vn`) và làm theo hướng dẫn trỏ DNS.
2. Settings → Environment variables (Production): `SITE_URL` = `https://<tên miền>`, `ALLOW_INDEX` = `1`. Để preview không có `ALLOW_INDEX`, nhờ vậy bản xem trước luôn bị chặn Google.
3. Chuyển hướng địa chỉ `pages.dev` cũ về tên miền (Bulk Redirects của Cloudflare, mã 301).
4. Deploy lại, rồi khai báo tên miền trong [Google Search Console](https://search.google.com/search-console) và gửi `https://<tên miền>/sitemap.xml`.

## Việc còn thiếu trước khi chạy thật

- Hotline, Zalo OA, email trong `site.config.mjs` (đang dùng số mẫu khi chạy thử, bản thật hiện "sắp có").
- Danh sách quận đợt 1 trong `serviceAreas`.
- API thật thay cho API giả (`lib/api.js` giữ nguyên định dạng, chỉ cần đặt biến môi trường):
  - Đặt lịch (VCsoft): `POST <NEXT_PUBLIC_BOOKING_ENDPOINT>` nhận JSON `{ dichVu, xe, bienSo, viTri, banDo?, gio, sdt, ghiChu, nguon }`, trả `{ ma: "VC-1234" }`.
  - Tra cứu (VCgarage): `NEXT_PUBLIC_TRACKING_ENDPOINT`. Trang gọi `GET <endpoint>?sdt=<số điện thoại>&ma=<mã lệnh>` và cần nhận JSON dạng `{ ma, dichVu, xe, trangThai, duKienPhut, tongTien, ktv: { ten, anh, chuyenMon, bienSo, sdt }, lichSu: [{ trangThai, luc }] }`, với `trangThai` là một trong `tiep-nhan`, `dang-toi`, `dang-sua`, `hoan-tat`, `da-thanh-toan`. API **phải kiểm tra khớp cả số điện thoại và mã lệnh**, trả 404 nếu không khớp, để người lạ không xem được lệnh (và vị trí xe) của khách khác. API cũng cần cho phép CORS từ tên miền website.
- Hồ sơ kỹ thuật viên: thêm file vào `content/ky-thuat-vien/` (ảnh thật, được KTV đồng ý). Có ít nhất một hồ sơ thì menu "Đội ngũ" và mục đội ngũ ở trang chủ tự hiện.
- Bản thật chưa có API đặt lịch thì form hiện nội dung để khách gửi qua Zalo hoặc đọc khi gọi.
- Bảng giá: kế hoạch muốn lấy giá phụ tùng từ dữ liệu VCparts, nên cần người phụ trách duyệt giá trước khi đưa lên.
- Ảnh việc thật (kế hoạch yêu cầu mỗi trang khu vực có ảnh tại khu đó). Đặt trong `public/anh/` và chèn vào bài bằng `![mô tả](/anh/ten-anh.jpg)`.
