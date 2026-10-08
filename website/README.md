# Website VC Mobile Care

Website dịch vụ sửa ô tô tận nơi, slogan "Xe dừng đâu, thợ tới đó", kèm CMS (trang quản trị) để đội marketing viết, duyệt, đăng bài mà không cần biết Git.

- **Next.js 16 + Payload CMS 3** trong cùng một ứng dụng. Database **PostgreSQL**.
- Web công khai: `/`, `/dich-vu/...`, `/cam-nang/...`, `/dat-lich/`.
- Trang quản trị: `/admin` (giao diện tiếng Việt).
- Chưa có tên miền thì Google bị chặn lập chỉ mục (thanh vàng trên đầu trang, `robots.txt` chặn, header `noindex`).

## Trang admin có gì

| Mục | Dùng để |
|---|---|
| Nội dung → Bài cẩm nang / Trang dịch vụ | Viết, sửa, xem trước, đăng bài. Mỗi bài lưu lịch sử phiên bản. |
| SEO → Từ khoá SEO | Bộ từ khoá (mỗi từ khoá một bài), trạng thái, nút **"AI viết bản nháp"**. |
| SEO → Kế hoạch SEO | Lịch đăng theo tháng, quy tắc nội dung. |
| Khách hàng → Lịch hẹn | Lịch khách đặt từ form `/dat-lich/`. Cập nhật trạng thái: đã gọi, đã hẹn thợ… |
| Hệ thống → Thông tin liên hệ | Hotline, Zalo, email, quận phục vụ. Sửa là web đổi ngay. |
| Hệ thống → Người dùng | Tài khoản và vai trò. |

### Vai trò

| Vai trò | Được làm |
|---|---|
| Quản trị | Mọi việc, thêm người dùng |
| Duyệt bài | Đăng bài, tick "Giá đã duyệt", sửa thông tin liên hệ, xoá bài |
| Biên tập | Viết và sửa bản nháp. **Không đăng được.** |

Người đầu tiên tạo tài khoản ở `/admin` tự thành Quản trị.

## Quy trình một bài (có AI hỗ trợ, có người duyệt)

```
Từ khoá SEO → mở từ khoá "Chưa viết" → bấm "AI viết bản nháp"
  → 2–5 phút sau có bản nháp bài cẩm nang (AI tra VCwiki + tài liệu công khai, ghi nguồn)
  → Biên tập đọc, sửa trong trình soạn thảo → đổi "Trạng thái duyệt" = Chờ duyệt → Lưu nháp
  → Người duyệt bấm "Xem trước" (biểu tượng ↗) để xem đúng như trên web
  → bấm "Xuất bản" → bài lên web ngay
```

Mỗi lần lưu, ô **"Kiểm tra bài"** ở cột phải tự chạy luật: độ dài tiêu đề và mô tả, số chữ, từ khoá trong đoạn đầu,
liên kết nội bộ hỏng, bài có giá chưa duyệt, trùng tiêu đề. **Còn lỗi thì không ai đăng được**, kể cả Quản trị.

AI **không bao giờ đăng**: bài AI viết luôn là bản nháp, kèm "Ghi chú của AI cho người duyệt" (câu cần kiểm tra kỹ, chỗ chưa có nguồn).

### Agent SEO Editor trong Claude Code

Agent `.claude/agents/seo-editor.md` cũng gửi bài vào CMS dưới dạng bản nháp qua API `POST /api/cam-nang/nhap-tu-markdown`.
Cần tạo một tài khoản vai trò **Biên tập** cho agent, bật "Enable API Key", rồi đặt `VCMC_URL` và `VCMC_API_KEY` trên máy chạy agent.

## VCwiki

`lib/vcwiki.ts` là chỗ nối VCwiki. **Chưa nối**, đang chờ tài liệu API. AI hiện vẫn viết được bằng nguồn công khai và ghi "Chưa dùng nguồn VCwiki" để người duyệt biết.
Khi nối phải giữ hai luật: chỉ lấy trang được đánh dấu công khai (VCwiki có giá nhập, quy trình, nhân sự), và luôn trả kèm link trang gốc.

## Cấu trúc code

| Đường dẫn | Nội dung |
|---|---|
| `payload.config.ts` | Cấu hình CMS: database, các bảng, trình soạn thảo, tiếng Việt |
| `collections/` | Bảng dữ liệu: bài cẩm nang, trang dịch vụ, từ khoá, lịch hẹn, ảnh, người dùng |
| `globals/` | Thông tin liên hệ, kế hoạch SEO |
| `lib/kiem-tra.mjs` | Luật kiểm tra bài (dùng khi lưu/đăng và trong `npm run kiem-tra`) |
| `lib/bai.ts`, `lib/quyen.ts` | Trường dùng chung, hook duyệt bài, phân quyền |
| `lib/ai/` | Gọi Claude viết bài, luồng tạo bản nháp |
| `lib/vcwiki.ts` | Cổng tra VCwiki (chờ nối) |
| `lib/cms.js` | Web công khai đọc dữ liệu từ CMS |
| `app/(frontend)/` | Giao diện web công khai |
| `app/(payload)/` | Trang admin và API của Payload (file sinh tự động, không sửa tay) |
| `migrations/` | Thay đổi cấu trúc database cho production |
| `du-lieu-mau/` | Dữ liệu ban đầu (6 trang dịch vụ, 2 bài, bộ từ khoá) để nạp lần đầu. Sửa ở đây **không** làm đổi web. |
| `site.config.mjs` | Tên thương hiệu, slogan, thành phố, địa chỉ web |
| `app/quan-tri/`, `lib/quan-tri/` | Trang quản trị nội dung & SEO `/quan-tri/` (đọc từ CMS, cần đăng nhập) |
| `lib/tu-lieu.mjs`, `scripts/so-trung.mjs` | Đọc tư liệu transcript, so bài với transcript để bắt đoạn chép nguyên văn |
| `../tu-lieu/transcript/` | Tư liệu transcript từ TIKTIKTOTEXT (xem `tu-lieu/README.md`) |

## Trang quản trị nội dung `/quan-tri/`

Đăng nhập bằng tài khoản CMS (chưa đăng nhập thì chuyển sang `/admin/login`). Trang đọc thẳng từ CMS, luôn có `noindex`:

- **Tổng quan**: số trang, trang có lỗi, tỉ lệ từ khoá đã có trang, tiến độ bài trong tháng, tư liệu chưa dùng, việc cần xử lý.
- **Trang & bài**: mọi trang (cả bản nháp), lọc theo loại và trạng thái. Mở một trang để xem bản xem trước trên Google, thử tiêu đề và mô tả khác, điểm kiểm tra (cùng luật CMS dùng khi đăng), số liệu, dàn ý, liên kết vào/ra, tư liệu cùng chủ đề và câu khách hỏi chưa có trong FAQ. Nút **Sửa** mở bài trong `/admin`.
- **Từ khoá**, **Lịch đăng**: đối chiếu với SEO → Từ khoá và Kế hoạch SEO trong CMS.
- **Tư liệu transcript**: video nào đã dùng ở bài nào, câu khách hỏi.
- **Viết bài mới**: điền từ khoá, tiêu đề, chọn tư liệu, rồi chép lệnh cho SEO Editor hoặc tạo bản nháp trong `/admin`.

## Chạy thử trên máy

Cần Node 22 và PostgreSQL.

```bash
cd website
cp .env.example .env        # điền DATABASE_URL, PAYLOAD_SECRET (openssl rand -hex 32)
npm install
npm run dev                 # http://localhost:3000 và http://localhost:3000/admin
npm run nap-du-lieu         # lần đầu: nạp 6 trang dịch vụ, 2 bài, 26 từ khoá
```

Khi chạy `npm run dev`, database tự cập nhật theo code. **Sửa cấu trúc bảng (thêm/bớt trường) xong thì tạo migration** trước khi đưa lên server:

```bash
NODE_ENV=production npm run migrate:create -- ten-thay-doi
```

Lệnh khác: `npm run kiem-tra` (kiểm tra mọi bài đã đăng), `npm run typecheck`, `npm run build`, `npm start`.

## Đưa lên server

Web giờ cần server chạy liên tục (không còn là trang tĩnh trên Cloudflare Pages). Cách gọn nhất là một VPS có Docker:

```bash
git clone … && cd buithoanh/website
cp .env.example .env          # điền PAYLOAD_SECRET, POSTGRES_PASSWORD, SITE_URL, ANTHROPIC_API_KEY
docker compose up -d --build  # web + PostgreSQL; migration tự chạy khi khởi động
docker compose run --rm cong-cu npm run nap-du-lieu   # lần đầu
```

Rồi đặt Caddy hoặc Nginx phía trước cổng 3000 để có HTTPS, mở `https://<tên miền>/admin` tạo tài khoản Quản trị đầu tiên.

Sao lưu: database (volume `db`, dùng `pg_dump`) và ảnh tải lên (volume `media`). Nên sao lưu tự động hằng ngày ra nơi khác.

### Khi đã có tên miền

1. Trỏ DNS về server, cấu hình HTTPS.
2. Trong `.env`: `SITE_URL=https://<tên miền>`, `ALLOW_INDEX=1`, rồi `docker compose up -d`.
3. Khai báo tên miền trong Google Search Console, gửi `https://<tên miền>/sitemap.xml`.

## Việc còn thiếu

- **Nối VCwiki** (chờ tài liệu API).
- Điền hotline, Zalo, email, quận phục vụ trong admin → Thông tin liên hệ.
- Thông báo khi có lịch hẹn mới (Gmail hoặc Zalo) — hiện chỉ xem được trong admin.
- Kéo số liệu Google Search Console về từng từ khoá để chọn bài cần viết lại.
- Chọn nơi đặt server và sao lưu.
- Ảnh việc thật: tải lên ở admin → Ảnh, chèn vào bài bằng trình soạn thảo.
