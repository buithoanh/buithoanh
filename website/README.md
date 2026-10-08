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
| `app/` | Giao diện: trang chủ, dịch vụ, cẩm nang, đặt lịch, sitemap, robots |

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

Muốn bắt buộc duyệt trên GitHub: Settings → Branches → thêm quy tắc cho nhánh `main`, bật "Require a pull request before merging" và "Require status checks" (chọn "Website – kiểm tra bài và build"). Không đặt số lượt approve bắt buộc, vì trang quản trị merge bằng token của repo; việc duyệt đã do trang quản trị kiểm soát.

## Trang quản trị `/quan-tri`

```
Quản trị bấm "AI lập kế hoạch" (chọn tháng, ghi định hướng)
  → AI (agent SEO Planner) mở PR "Kế hoạch SEO <tháng>" sửa baiKeHoach trong ke-hoach-seo.json
  → quản trị đọc bảng kế hoạch, góp ý → AI sửa trên cùng PR → "Duyệt kế hoạch" (merge)
  → quản trị tick các bài, bấm "AI viết bài" → AI (SEO Editor) mở mỗi bài một PR "Bài mới: …"
  → người duyệt đăng nhập, đọc bài, góp ý → AI sửa → "Duyệt và đăng" (merge) → bài lên web
```

- Hai vai trò: **quản trị** (`ADMIN_EMAILS`) làm mọi việc; **duyệt bài** (`REVIEWER_EMAILS`) chỉ duyệt / góp ý / bỏ bài.
- Đăng nhập bằng email nhận mã qua Cloudflare Access; không cần tài khoản GitHub.
- Mọi góp ý và lần duyệt được ghi thành comment trên PR, kèm email người làm.
- Trang chỉ merge được PR nhánh `ke-hoach/*` hoặc `bai/*`, chỉ đổi đúng file của nó, kiểm tra tự động đã đạt, và đúng
  phiên bản người duyệt vừa đọc. PR khác phải duyệt trên GitHub.
- Mã: giao diện `app/quan-tri/`, API `functions/api/quan-tri/` (Cloudflare Pages Functions), `lib/quan-tri/`,
  AI chạy bằng `.github/workflows/ai-agent.yml`. Test: `npm test`.

### Cài đặt (làm một lần)

**1. Đưa code vào nhánh `main`.** Workflow AI chỉ gọi được khi file đã nằm trên `main`.

**2. Token cho AI (GitHub → repo → Settings → Secrets and variables → Actions):**

| Secret | Lấy ở đâu |
|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | Trên máy Mac đã đăng nhập Claude: chạy `claude setup-token`, dán token. AI dùng hạn mức gói Claude của tài khoản này. |
| `GH_PAT` | GitHub → Settings → Developer settings → Fine-grained token, chỉ repo này, quyền: Contents, Pull requests, Issues, Actions = Read and write. |
| `VC_CONTENT_URL` | Địa chỉ kho tư liệu qua đường hầm, ví dụ `https://vc-content.<tên miền>/mcp` (bước 5). Bỏ trống thì AI chạy không có kho. |
| `VC_CONTENT_CLIENT_ID`, `VC_CONTENT_CLIENT_SECRET` | Service token của Cloudflare Access (bước 5). |

**3. Cloudflare Access cho trang quản trị.** Cloudflare → Zero Trust → Access → Applications → Add → Self-hosted:
- Tên miền: tên miền web (hoặc `<project>.pages.dev`), thêm 2 đường dẫn `quan-tri` và `api/quan-tri`.
- Policy: Allow, Include → Emails → email quản trị và người duyệt. Login method: One-time PIN.
- Lưu lại **Application Audience (AUD) Tag**; tên team ở Zero Trust → Settings (dạng `<team>.cloudflareaccess.com`).

**4. Biến môi trường Cloudflare Pages** (project → Settings → Variables and secrets, Production):

| Biến | Giá trị |
|---|---|
| `GITHUB_TOKEN` (secret) | Fine-grained token như `GH_PAT` (có thể dùng chung) |
| `GITHUB_REPO` | `buithoanh/buithoanh` |
| `ACCESS_TEAM_DOMAIN` | `<team>.cloudflareaccess.com` |
| `ACCESS_AUD` | AUD Tag ở bước 3 |
| `ADMIN_EMAILS` | email quản trị, cách nhau dấu phẩy |
| `REVIEWER_EMAILS` | email người duyệt bài, cách nhau dấu phẩy |

Thêm/bớt người: sửa cả policy Access (bước 3) và biến email, rồi deploy lại.

**5. Đường hầm tới kho `vc-content` trên máy Mac** (cần một tên miền đã đưa vào Cloudflare):
```bash
brew install cloudflared
cloudflared tunnel login
cloudflared tunnel create vc-content
cloudflared tunnel route dns vc-content vc-content.<tên miền>
cloudflared tunnel run --url http://localhost:8000 vc-content
```
Rồi Zero Trust → Access → Service Auth → tạo Service token (lấy Client ID / Secret cho bước 2), và tạo Access
application cho `vc-content.<tên miền>` với policy **Service Auth** → token đó. Không có token thì không ai gọi được kho.
Máy Mac phải bật và `vc-content` + `cloudflared` phải chạy khi AI cần tra kho.

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

- Hotline, Zalo OA, email trong `site.config.mjs` (đang hiện "sắp có").
- Danh sách quận đợt 1 trong `serviceAreas`.
- Form đặt lịch chưa có nơi nhận. Khi VCsoft có API nhận lịch, đặt biến `NEXT_PUBLIC_BOOKING_ENDPOINT`. Trước đó form hiện nội dung để khách gửi qua Zalo hoặc đọc khi gọi.
- Bảng giá: kế hoạch muốn lấy giá phụ tùng từ dữ liệu VCparts, nên cần người phụ trách duyệt giá trước khi đưa lên.
- Ảnh việc thật (kế hoạch yêu cầu mỗi trang khu vực có ảnh tại khu đó). Đặt trong `public/anh/` và chèn vào bài bằng `![mô tả](/anh/ten-anh.jpg)`.
