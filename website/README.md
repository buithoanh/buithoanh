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
| `lib/kiem-tra.mjs` | Bộ quy tắc kiểm tra bài (độ dài tiêu đề và mô tả, số chữ, từ khoá, liên kết hỏng, bài có giá chưa duyệt, chép nguyên văn transcript), dùng chung cho build và trang quản trị |
| `scripts/kiem-tra-bai.mjs` | Chạy bộ quy tắc trước khi build; có lỗi thì dừng |
| `scripts/quan-tri/` | Tạo trang quản trị `/quan-tri/` sau khi build |
| `scripts/so-trung.mjs` | So bài hoặc kịch bản với transcript, báo đoạn chép nguyên văn |
| `../tu-lieu/transcript/` | Tư liệu transcript từ TIKTIKTOTEXT (xem `tu-lieu/README.md`) |
| `app/` | Giao diện: trang chủ, dịch vụ, cẩm nang, đặt lịch, sitemap, robots |

## Trang quản trị `/quan-tri/`

Mở `https://vc-mobile-care.pages.dev/quan-tri/` (hoặc `out/quan-tri/index.html` sau khi build trên máy). Trang chỉ đọc và được tạo lại mỗi lần build:

- **Tổng quan**: số trang, trang có lỗi, tỉ lệ từ khoá đã có trang, tiến độ bài trong tháng, tư liệu chưa dùng, danh sách cần xử lý.
- **Trang & bài**: bảng mọi trang, lọc theo loại và trạng thái. Bấm vào một trang (ví dụ `#trang/dich-vu/ac-quy`) để xem bản xem trước trên Google, thử tiêu đề và mô tả khác, điểm kiểm tra, số liệu, dàn ý, liên kết vào/ra, tư liệu cùng chủ đề và câu khách hỏi chưa có trong FAQ.
- **Từ khoá**, **Lịch đăng**: đối chiếu với `ke-hoach-seo.json`.
- **Tư liệu transcript**: video nào đã dùng ở bài nào, câu khách hỏi.
- **Viết bài mới**: điền từ khoá, tiêu đề, chọn tư liệu, rồi chép lệnh cho SEO Editor hoặc tạo bản nháp trên GitHub.

Sửa bài luôn đi qua GitHub và pull request, nên trang quản trị không cần đăng nhập hay server. Trang gắn `noindex`, không nằm trong sitemap; nên khoá thêm bằng Cloudflare Access (xem mục Hướng dẫn trong trang).

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
npm run quan-tri     # tạo lại trang quản trị (cần build trước)
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

- Hotline, Zalo OA, email trong `site.config.mjs` (đang hiện "sắp có").
- Danh sách quận đợt 1 trong `serviceAreas`.
- Form đặt lịch chưa có nơi nhận. Khi VCsoft có API nhận lịch, đặt biến `NEXT_PUBLIC_BOOKING_ENDPOINT`. Trước đó form hiện nội dung để khách gửi qua Zalo hoặc đọc khi gọi.
- Bảng giá: kế hoạch muốn lấy giá phụ tùng từ dữ liệu VCparts, nên cần người phụ trách duyệt giá trước khi đưa lên.
- Ảnh việc thật (kế hoạch yêu cầu mỗi trang khu vực có ảnh tại khu đó). Đặt trong `public/anh/` và chèn vào bài bằng `![mô tả](/anh/ten-anh.jpg)`.
