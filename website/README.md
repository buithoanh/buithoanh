# Website ThợTới

Website dịch vụ sửa ô tô tận nơi, slogan "Xe dừng đâu, thợ tới đó", kèm CMS (trang quản trị) để đội marketing viết, duyệt, đăng bài mà không cần biết Git.

- **Next.js 16 + Payload CMS 3** trong cùng một ứng dụng. Database **PostgreSQL**.
- Web công khai dựng theo thiết kế `docs/thiet-ke/` (điện thoại 390px là chuẩn, máy tính co giãn): `/`, `/dich-vu/...`,
  `/hang-xe/...`, `/xe-dien/`, `/bang-gia/`, `/hoi-vien/`, `/doanh-nghiep/`, `/tuyen-tho/`, `/ve-chung-toi/`, `/cam-nang/...`,
  `/tra-cuu-xe/`; luồng đơn `/dat-lich/`, `/goi-gap/`, link riêng của khách `/don/<token>/` (theo dõi, báo giá, thanh toán, đánh giá).
- Màn quản trị: `/quan-tri/bai-viet/`, `/quan-tri/bang-gia/`, `/quan-tri/ma-khuyen-mai/`, `/quan-tri/so-lieu/` (đăng nhập bằng tài khoản CMS).
  Danh sách màn, chỗ khác thiết kế, việc còn lại: `docs/BAN-GIAO-FE.md`.
- Trang quản trị: `/admin` (giao diện tiếng Việt).
- Chưa có tên miền thì Google bị chặn lập chỉ mục (thanh vàng trên đầu trang, `robots.txt` chặn, header `noindex`).

## Trang admin có gì

| Mục | Dùng để |
|---|---|
| Đơn hàng → Đơn hàng | Đơn đặt lịch và gọi gấp (khẩn cấp luôn ở đầu). Đổi trạng thái theo thứ tự, xem lịch sử, nguồn khách, giá sơ bộ lúc đặt, thợ, tiền đã nhận, hoá đơn, bảo hành, đánh giá. |
| Đơn hàng → Thợ, Báo giá, Giao dịch, Phiếu bảo hành, Khiếu nại, Tin nhắn | Hồ sơ thợ; báo giá chính thức khách đã duyệt; tiền về từ ngân hàng (đối soát); bảo hành; phiếu khiếu nại từ đánh giá thấp; nhật ký tin Zalo/SMS. |
| Marketing → Mã khuyến mãi, Mã giới thiệu, Số liệu | Mã KM, KOC, cây xăng, BQL (giảm, hạn, hoa hồng, QR); mã giới thiệu bạn bè (tạm dừng, cộng lượt tay); sự kiện xem trang, bấm gọi, bấm Zalo. |
| Khách hàng → Gói hội viên, Hội viên, Yêu cầu doanh nghiệp | Giá và quyền lợi 2 gói; đăng ký gói theo biển số (hạn dùng, đã trả tiền); yêu cầu báo giá hợp đồng của doanh nghiệp (giao sales). |
| Đơn hàng → Hồ sơ thợ cộng tác | Hồ sơ thợ đăng ký trên web, ảnh chứng chỉ (chỉ quản trị, quản lý dịch vụ xem). |
| Bảng giá & danh mục | Danh mục dịch vụ (bật/tắt nhận đặt, báo giá sơ bộ), hạng mục giá (công cố định, phụ tùng theo phân khúc A–D), **nhật ký đổi giá** (tự ghi), phí chung – bảo hành – phân khúc, hãng và dòng xe (nút đồng bộ VCparts). |
| Vùng phục vụ & lịch | Quận (thời gian thợ tới), phường (bật/tắt), giờ nhận đơn gấp, khung giờ đặt lịch (giới hạn đơn mỗi khung), ngày nghỉ. |
| Khách hàng → Đánh giá hiển thị | Đánh giá thật của khách để hiện trên web. |
| Nội dung → Bài cẩm nang / Trang dịch vụ / Trang khu vực / Trang hãng xe | Viết, sửa, xem trước, gửi duyệt, hẹn giờ, đăng. Mỗi bài lưu lịch sử phiên bản. |
| SEO → Từ khoá SEO, Kế hoạch SEO | Bộ từ khoá (nút **"AI viết bản nháp"**), lịch đăng, quy tắc. |
| Hệ thống → Cấu hình chung | Hotline, Zalo OA, pháp nhân, MST, địa chỉ, điểm Google, sự cố trên màn gọi gấp, tài khoản nhận tiền (VietQR), CSKH, mục tiêu số liệu. Sửa là web đổi ngay. |
| Hệ thống → Người dùng | Tài khoản, vai trò, khoá API (agent SEO Editor, phần mềm điều phối). |

Trang `/quan-tri/` là bảng điều khiển nội dung & SEO (xem bên dưới). API cho giao diện và cho VCsoft: `docs/api.md`.
Việc backend đã làm, chưa làm, tích hợp đang giả lập: `docs/BAN-GIAO-BE.md`.

### Vai trò

| Vai trò | Được làm |
|---|---|
| Quản trị | Mọi việc, thêm người dùng, sửa tay trạng thái đơn đã xong |
| Quản lý dịch vụ | Sửa giá, danh mục, vùng, giờ, ngày nghỉ, gói hội viên; duyệt, hẹn giờ và đăng bài; xử lý đơn, khiếu nại, hội viên, hồ sơ thợ; xem số liệu |
| Biên tập nội dung (VCmedia) | Viết, sửa bản nháp, tải ảnh, gửi duyệt. **Không đăng, không sửa giá, không xem đơn.** |
| Marketing | Viết nháp, quản lý đánh giá hiển thị, mã khuyến mãi và hoa hồng, mã giới thiệu, yêu cầu doanh nghiệp, số liệu |
| Điều phối | Xem, nhập đơn, đổi trạng thái, xếp thợ, gửi báo giá, thu tay, xử lý khiếu nại (người hoặc tài khoản máy của phần mềm điều phối có khoá API) |

Người đầu tiên tạo tài khoản ở `/admin` tự thành Quản trị. Vai trò "Duyệt bài" cũ được migration đổi thành "Quản lý dịch vụ".

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
| `collections/` | Bảng dữ liệu: đơn hàng, danh mục và giá, xe, quận/phường, đánh giá, bài cẩm nang, trang dịch vụ, từ khoá, ảnh, người dùng |
| `globals/` | Cấu hình chung, phí chung, giờ nhận đơn, kế hoạch SEO |
| `lib/cong-khai.ts` | Dữ liệu công khai cho từng màn (bảng giá, báo giá sơ bộ, vùng, khung giờ); trang server và `/api/trang/...` dùng chung |
| `lib/don/` | Tạo đơn, kiểm tra đầu vào, luồng trạng thái, link theo dõi, phục vụ (thợ, báo giá, thanh toán, hoá đơn, bảo hành), đánh giá, tin nhắn |
| `lib/tich-hop/` | Adapter tích hợp ngoài: bản đồ, điều phối, Zalo ZNS, SMS, VCparts, ngân hàng, hoá đơn điện tử, tra MST (bản thật + giả lập) |
| `lib/*.mjs` | Phần thuần, có kiểm thử: tính giá, biển số, số điện thoại, vùng, khung giờ, VietQR, khuyến mãi, báo giá và quyền lợi hội viên, bảo hành, sự kiện, form P2 |
| `lib/tra-cuu-xe.ts`, `lib/ma-khuyen-mai.ts`, `lib/so-lieu.ts`, `lib/noi-dung.ts` | Tra cứu lịch sử xe, mã khuyến mãi và hoa hồng, báo cáo số liệu, trang khu vực và bài hẹn giờ |
| `lib/hoi-vien.ts`, `lib/gioi-thieu.ts`, `lib/p2.ts` | Gói hội viên, giới thiệu bạn bè, yêu cầu doanh nghiệp, hồ sơ thợ cộng tác |
| `tests/` | Kiểm thử đơn vị (`don-vi/`) và tích hợp (`tich-hop/`) |
| `lib/kiem-tra.mjs` | Luật kiểm tra bài (dùng khi lưu/đăng và trong `npm run kiem-tra`) |
| `lib/bai.ts`, `lib/quyen.ts` | Trường dùng chung, hook duyệt bài, phân quyền 5 vai trò |
| `lib/ai/` | Gọi Claude viết bài, luồng tạo bản nháp |
| `lib/vcwiki.ts` | Cổng tra VCwiki (chờ nối) |
| `lib/cms.js`, `lib/giao-dien.js` | Web công khai đọc dữ liệu từ CMS; dữ liệu header/footer (`layChung()`) |
| `app/(frontend)/(trang)/` | Trang công khai (header, footer, thanh liên hệ dưới đáy điện thoại) |
| `app/(frontend)/(don)/` | Đặt lịch, gọi gấp, link riêng của khách (khung điện thoại, máy tính canh giữa) |
| `app/(frontend)/globals.css` | Biến màu theo thiết kế (`--toi`, `--nhan`, `--nen`…) và lớp dùng chung |
| `app/(quan-tri)/`, `components/quan-tri/`, `lib/quan-tri/phien.js` | Màn quản trị bài viết, bảng giá, mã khuyến mãi, số liệu (ẩn/khoá theo vai trò) |
| `components/chung/` | Header, footer, thanh liên hệ, ô nhập form, ô đồng ý dữ liệu, chọn xe, khung ảnh, breadcrumb, ghi sự kiện |
| `components/trang/`, `noi-dung/`, `p2/`, `don/`, `phuc-vu/` | Component theo nhóm màn (CSS Modules cạnh file) |
| `lib/su-kien-client.js` | Ghi xem trang, bấm gọi/Zalo, gửi form; giữ nguồn khách (utm, `?ma=`) suốt phiên |
| `app/(payload)/` | Trang admin và API của Payload (file sinh tự động, không sửa tay) |
| `migrations/` | Thay đổi cấu trúc database cho production |
| `du-lieu-mau/` | Dữ liệu ban đầu (trang dịch vụ, bài, từ khoá, `bang-gia.json`, `xe.json`, `vung.json`) để nạp lần đầu. Sửa ở đây **không** làm đổi web. |
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
npm run nap-du-lieu         # lần đầu: trang dịch vụ, bài, từ khoá, bảng giá, xe, quận, khung giờ (dữ liệu mẫu)
```

Khi chạy `npm run dev`, database tự cập nhật theo code. **Sửa cấu trúc bảng (thêm/bớt trường) xong thì tạo migration** trước khi đưa lên server:

```bash
NODE_ENV=production npm run migrate:create -- ten-thay-doi
```

Lệnh khác: `npm run kiem-tra` (kiểm tra mọi bài đã đăng), `npm run typecheck`, `npm run build`, `npm start`.

Kiểm thử: `npm test` (tính giá, biển số, vùng, khung giờ, trạng thái đơn; không cần database),
`npm run test:tich-hop` (phân quyền, đơn hàng, báo giá trên database đã nạp dữ liệu mẫu) và `npm run test:e2e`
(Playwright, bấm thử giao diện trên bản build: trang công khai 390/1440px, đặt lịch, gọi gấp, báo giá, thanh toán, đánh giá,
tra cứu xe, sửa giá, phân quyền, mã khuyến mãi). CI chạy cả ba. Chạy e2e trên máy:

```bash
export NODE_ENV=production TICH_HOP_GIA_LAP=tat-ca NAP_DU_LIEU_THU=1   # database kiểm thử, không phải database thật
npm run migrate && npm run nap-du-lieu && npm run build && npm start   # cửa sổ 1
npm run test:e2e                                                       # cửa sổ 2
node scripts/tao-don-thu.mjs        # tạo đơn ở mọi trạng thái, in link /don/... để mở tay
node scripts/chup-man-hinh.mjs / /bang-gia/ --rong=390   # chụp màn hình để so với thiết kế
```

e2e nâng "Số đơn tối đa" mỗi khung giờ lên 1000 trước khi chạy (`tests/e2e/chuan-bi.mjs`), nên chỉ chạy trên database kiểm thử.

`npm run nap-du-lieu` khi chạy thử còn tạo tài khoản thử cho từng vai trò (`quantri@thotoi.test`, `quanly@`, `bientap@`,
`marketing@`, `dieuphoi@`; mật khẩu `ThoToi-ThuNghiem-2026` hoặc biến `MAT_KHAU_TAI_KHOAN_THU`), đơn mẫu và đánh giá mẫu.
Chạy trên production thì không tạo những thứ đó (trừ khi đặt `NAP_DU_LIEU_THU=1`, chỉ dùng cho máy kiểm thử).

## Đưa lên server

Web giờ cần server chạy liên tục (không còn là trang tĩnh trên Cloudflare Pages). Cách gọn nhất là một VPS có Docker:

```bash
git clone … && cd buithoanh/website
cp .env.example .env          # điền PAYLOAD_SECRET, POSTGRES_PASSWORD, SITE_URL, ANTHROPIC_API_KEY và khoá tích hợp
docker compose up -d --build  # web + PostgreSQL + hen-gio (gọi /api/viec-dinh-ky mỗi 5 phút, đặt VIEC_DINH_KY_KEY); migration tự chạy khi khởi động
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
- Điền hotline, Zalo, pháp nhân trong admin → Cấu hình chung; duyệt lại bảng giá, quận, khung giờ (đang là dữ liệu mẫu).
- Khoá tích hợp thật: bản đồ, điều phối, Zalo ZNS, SMS, VCparts (xem `docs/BAN-GIAO-BE.md`).
- Kéo số liệu Google Search Console về từng từ khoá để chọn bài cần viết lại.
- Chọn nơi đặt server và sao lưu.
- Ảnh việc thật: tải lên ở admin → Ảnh, chèn vào bài bằng trình soạn thảo. Giao diện đang hiện khung giữ chỗ ở chỗ chưa có ảnh.
- Chốt danh sách khu vực phục vụ theo địa giới mới (phường); giao diện lấy tên khu vực từ dữ liệu nên chỉ cần sửa trong admin.
- Duyệt nội dung pháp lý: `/chinh-sach-bao-hanh/`, `/chinh-sach-du-lieu/`, câu bảo hành hãng ở `/xe-dien/`.
