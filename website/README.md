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
| `content/thong-tin.json` | Hotline, Zalo, email, quận phục vụ, xưởng đối tác (sửa được ở trang quản trị) |
| `app/` | Giao diện: trang chủ, dịch vụ, cẩm nang, đặt lịch, quản trị, sitemap, robots |
| `functions/`, `cf/` | Hàm chạy trên Cloudflare Pages: nhận lịch hẹn, API trang quản trị, đăng nhập GitHub cho trang soạn bài |
| `public/quan-tri/bai-viet/` | Trang soạn bài (Decap CMS) và cấu hình `config.yml` |

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

## Trang quản trị `/quan-tri/`

| Địa chỉ | Việc | Đăng nhập |
|---|---|---|
| `/quan-tri/` | Xem lịch hẹn khách đặt trên web, đổi trạng thái (Mới → Đã gọi → Đang làm → Xong / Huỷ), ghi chú nội bộ, bấm gọi / Zalo / mở bản đồ. Tự làm mới mỗi phút. | Mật khẩu chung (`ADMIN_PASSWORD`) |
| `/quan-tri/bai-viet/` | Soạn, sửa bài cẩm nang và trang dịch vụ, tải ảnh, sửa hotline/Zalo/quận phục vụ. Mỗi lần lưu là một pull request; bấm **Publish** trong trang soạn bài = merge = lên web. | Tài khoản GitHub có quyền ghi repo |

Trang soạn bài chỉ đăng nhập được trên địa chỉ chính (`vc-mobile-care.pages.dev` hoặc tên miền), không chạy trên link xem trước của pull request.

### Cài đặt một lần trên Cloudflare

**1. Nơi lưu lịch hẹn (D1)**
- Cloudflare → **Storage & Databases** → **D1** → **Create** → đặt tên `vc-mobile-care`.
- Pages → project → **Settings** → **Bindings** → **Add** → **D1 database**: tên biến `DB`, chọn database vừa tạo.
- Bảng `lich_hen` tự tạo ở lần đặt lịch đầu tiên, không cần chạy SQL.

**2. Mật khẩu trang quản trị**
- Pages → **Settings** → **Variables and Secrets** → **Add** → loại **Secret**, tên `ADMIN_PASSWORD`, giá trị là mật khẩu dài (từ 12 ký tự). Đổi mật khẩu là mọi người đang đăng nhập bị đăng xuất.
- Muốn mỗi nhân viên đăng nhập bằng email riêng: bật thêm **Cloudflare Access** (Zero Trust → Access → Applications) cho `/quan-tri/*` và `/api/quan-tri/*`.

**3. Đăng nhập GitHub cho trang soạn bài**
- GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**:
  - Homepage URL: `https://vc-mobile-care.pages.dev`
  - Authorization callback URL: `https://vc-mobile-care.pages.dev/api/cms/callback`
- Tạo xong, bấm **Generate a new client secret**.
- Cloudflare Pages → **Variables and Secrets**: thêm `GITHUB_CLIENT_ID` (Text) và `GITHUB_CLIENT_SECRET` (Secret).
- Khi đổi sang tên miền thật: sửa hai địa chỉ trên trong OAuth App, và `site_url` trong `public/quan-tri/bai-viet/config.yml`.

Thêm biến/binding xong phải **deploy lại** (Deployments → bản mới nhất → Retry deployment) mới có hiệu lực. Chưa gắn D1 thì form đặt lịch tự chuyển sang hiện nội dung để khách gửi Zalo/gọi, như trước.

## Chạy thử trên máy

```bash
cd website
npm install
npm run dev          # http://localhost:3000
npm run kiem-tra     # chỉ kiểm tra bài
npm run build        # kiểm tra + xuất trang tĩnh ra out/
# Chạy cả API (đặt lịch, quản trị) với D1 giả lập trên máy:
npx wrangler pages dev out --d1 DB=local --binding ADMIN_PASSWORD=thu123
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

- Hotline, Zalo OA, email, quận đợt 1: sửa ở `/quan-tri/bai-viet/` → Cài đặt → Thông tin liên hệ (đang hiện "sắp có").
- Gắn D1 và đặt mật khẩu quản trị (mục "Trang quản trị") để nhận lịch hẹn. Khi VCsoft có API nhận lịch, đặt `NEXT_PUBLIC_BOOKING_ENDPOINT` để form gửi thẳng sang đó.
- Chưa có báo tin cho nhân viên khi có lịch mới (Zalo/Telegram); hiện phải mở `/quan-tri/` để xem.
- Bảng giá: kế hoạch muốn lấy giá phụ tùng từ dữ liệu VCparts, nên cần người phụ trách duyệt giá trước khi đưa lên.
- Ảnh việc thật (kế hoạch yêu cầu mỗi trang khu vực có ảnh tại khu đó). Đặt trong `public/anh/` và chèn vào bài bằng `![mô tả](/anh/ten-anh.jpg)`.
