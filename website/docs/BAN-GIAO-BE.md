# Bàn giao backend ThợTới

Nhánh: `claude/youthful-hawking-7jm5p2`. Làm theo `docs/prompts/1-backend.md`, thiết kế `docs/thiet-ke/`.
Hợp đồng API (ví dụ chạy thật): `docs/api.md`. Kiểu dữ liệu: `payload-types.ts` (`npm run generate:types`).

## Tình trạng

| Phần | Tình trạng |
|---|---|
| Gộp `main` (giao diện mới, `/quan-tri/`) vào Payload | **Xong** (phiên 1) |
| Đổi thương hiệu sang ThợTới, "by VC Phồn Vinh" | **Xong** (phiên 1) |
| P0 – Danh mục, bảng giá A–D, nhật ký giá, phí chung, xe, báo giá sơ bộ, vùng phục vụ, giờ nhận đơn, cấu hình chung, đánh giá hiển thị | **Xong** (phiên 1) |
| P0 – Đơn đặt lịch và gọi gấp, trạng thái, link riêng, chống spam | **Xong** (phiên 1) |
| P1 – Phục vụ khách sau khi đặt (thợ, báo giá chính thức, VietQR, hoá đơn, bảo hành, đánh giá – khiếu nại, tra cứu xe, tin Zalo) | Chưa làm (phiên 2) |
| P1 – Quản trị (bài viết, trang khu vực, trang hãng xe, mã khuyến mãi, hoa hồng, số liệu) | Chưa làm (phiên 2). 5 vai trò đã có từ P0 |
| P2 – Hội viên, giới thiệu bạn bè, doanh nghiệp, tuyển thợ | Chưa làm (phiên 3) |

## Phiên 1 đã làm gì

### Gộp `main`
- Giao diện công khai mới của `main` (hero, lối tắt sự cố, thẻ dịch vụ có ảnh, cột gọi thợ, logo, icon, ảnh tạm) đọc dữ liệu
  từ Payload qua `lib/cms.js`. Bỏ hướng trang tĩnh Cloudflare Pages / sửa bài qua GitHub.
- `/quan-tri/` (bảng điều khiển nội dung & SEO của `main`) giờ là route `app/quan-tri/route.ts`, đọc thẳng CMS mỗi lần mở,
  cần đăng nhập. Nút Sửa mở bài trong `/admin`. Frontend dựng thêm các màn `/quan-tri/bai-viet/`, `/quan-tri/bang-gia/`…
  dưới đường dẫn này (route hiện tại chỉ chiếm đúng `/quan-tri/`).
- Luật kiểm tra bài gom về `cacMucKiemTra()` trong `lib/kiem-tra.mjs`, thêm 2 luật của `main`: chép nguyên văn tư liệu
  transcript (chặn đăng), tiêu đề lặp tên thương hiệu (cảnh báo). Trường "Tư liệu đã dùng" trên bài.

### P0
| Thiết kế | Backend |
|---|---|
| Danh mục dịch vụ | `danh-muc-dich-vu`: mã, tên, slug (trùng slug Trang dịch vụ), mô tả, thứ tự, bật/tắt nhận đặt, bật/tắt báo giá sơ bộ, hiện trên bảng giá |
| Hạng mục giá | `hang-muc-gia`: tiền công (giá cố định, 0 = miễn phí, đơn vị như /km) hoặc phụ tùng (khoảng từ–đến cho A, B, C, D), ghi chú, cách tính vào báo giá sơ bộ, "nổi bật" cho bảng giá nhanh trang chủ |
| Nhật ký đổi giá | `nhat-ky-gia`: tự ghi mỗi lần đổi giá hạng mục hoặc phí chung (ai, lúc nào, vai trò, giá cũ, giá mới, lý do). Không ai sửa/xoá được |
| Hãng, dòng, đời xe | `hang-xe`, `dong-xe` (phân khúc A–D, đời từ–đến, xe điện, cờ "cần gán"), đồng bộ VCparts `POST /api/dong-xe/dong-bo-vcparts` |
| Phí chung | global `bang-gia-chung`: phí đi lại, phí kiểm tra, bảo hành 6/3 tháng, cứu hộ 60 phút, cố vấn gọi lại 15 phút, mô tả 4 phân khúc |
| Báo giá sơ bộ | `POST /api/bao-gia-so-bo` (`lib/tinh-gia.mjs` + `lib/cong-khai.ts`) |
| Vùng phục vụ | `quan` (đang phục vụ, thời gian tới từ–đến, ranh giới GeoJSON tuỳ chọn), `phuong` (bật/tắt, ghi chú). `POST /api/vung-phuc-vu/kiem-tra` |
| Giờ nhận đơn, khung giờ, ngày nghỉ | global `lich-nhan-don`. `GET /api/lich-dat/khung-gio` (đầy, đã qua, nghỉ) |
| Cấu hình chung | global `cai-dat` (đổi tên "Cấu hình chung"): hotline, Zalo OA, email, pháp nhân, MST, địa chỉ, link + điểm + số đánh giá Google, sự cố trên màn gọi gấp |
| Đánh giá khách hiển thị | `danh-gia`: chỉ đánh giá thật, có quận, ngày, gắn dịch vụ; cờ "dữ liệu mẫu" không bao giờ trả ra khi production |
| Đơn hàng | `don-hang` + `tep-don-hang` (ảnh/video, không công khai). `POST /api/don-hang/dat-lich`, `POST /api/don-hang/goi-gap`, `GET /api/don-hang/theo-doi/:token`, `POST /api/don-hang/:ma/trang-thai` |
| Dữ liệu từng màn | `GET /api/trang/{chung,chu,bang-gia,dich-vu/:slug,khu-vuc/:dv/:quan,hang-xe/:hang,xe-dien,dat-lich,goi-gap,danh-gia}`; trang server gọi thẳng `lib/cong-khai.ts` |

Kiểm thử: `npm test` (22 ca: tính giá, biển số, số điện thoại, vùng, khung giờ, trạng thái đơn, đầu vào form, kênh nguồn,
giới hạn tần suất) và `npm run test:tich-hop` (16 ca trên database: phân quyền từng vai trò, nhật ký giá, báo giá theo dòng
xe, vùng, tạo đơn, link hết hạn, khung đầy, ngoài vùng, chưa đồng ý dữ liệu, đơn khẩn cấp lên đầu). Cả hai chạy trong CI.

Migration: `migrations/20261008_100259_tu_lieu` (trường tư liệu), `20261008_102632_p0_danh_muc_gia_vung_don_hang`
(toàn bộ P0, đổi vai trò "duyetBai" → "quanLyDichVu", sequence mã đơn). Đã thử: database trống, database cũ có dữ liệu,
chạy `down` rồi `up` lại.

## Tích hợp ngoài: đang giả lập

Mỗi tích hợp một module trong `lib/tich-hop/`, khung chung ở `chung.ts`. Đủ biến môi trường → bản thật. Thiếu khi chạy thử →
giả lập (ghi log `[giả lập …]`). Thiếu khi `NODE_ENV=production` → gọi tới là báo lỗi, lúc khởi động log ERROR liệt kê;
muốn giả lập trên staging/CI phải ghi rõ `TICH_HOP_GIA_LAP=ban-do,dieu-phoi,…` hoặc `tat-ca`.
Tình trạng: `GET /api/tich-hop/trang-thai` (quản trị).

| Tích hợp | Module | Biến môi trường | Bản thật | Ghi chú |
|---|---|---|---|---|
| Bản đồ, geocoding | `ban-do.ts` | `GOOGLE_MAPS_API_KEY` | Google Geocoding API | Giả lập: khung chữ nhật gần đúng 4 quận (chỉ để chạy thử) |
| Phần mềm điều phối | `dieu-phoi.ts` | `DIEU_PHOI_URL`, `DIEU_PHOI_KEY`, (`SDT_TRUC_DIEU_PHOI`) | **Giả định** `POST /don-hang`, `POST /don-hang/:ma/trang-thai`, Bearer | Chờ VCsoft xác nhận hợp đồng; xem `api.md` |
| Zalo ZNS | `thong-bao.ts` | `ZALO_ZNS_ACCESS_TOKEN`, `ZALO_ZNS_MAU_XAC_NHAN` | API ZNS chính thức | P0 chỉ gửi tin xác nhận đơn; tên trường mẫu tin (`ten_khach`, `ma_don`…) phải khớp mẫu đăng ký với Zalo |
| SMS dự phòng | `thong-bao.ts` | `SMS_URL`, `SMS_KEY` | **Giả định** `POST {to, text}` | Chưa chọn nhà mạng |
| VCparts | `vcparts.ts` | `VCPARTS_URL`, `VCPARTS_KEY` | **Giả định** `GET /danh-muc-xe` | Giả lập đọc `du-lieu-mau/xe.json` |

Chưa có module (thuộc P1/P2): ngân hàng/VietQR (Casso/SePay), hoá đơn điện tử, tra MST, Google Reviews.

## Biến môi trường mới
Xem `.env.example`: `TICH_HOP_GIA_LAP`, `GOOGLE_MAPS_API_KEY`, `DIEU_PHOI_URL`, `DIEU_PHOI_KEY`, `SDT_TRUC_DIEU_PHOI`,
`ZALO_ZNS_ACCESS_TOKEN`, `ZALO_ZNS_MAU_XAC_NHAN`, `SMS_URL`, `SMS_KEY`, `VCPARTS_URL`, `VCPARTS_KEY`, `MAT_KHAU_TAI_KHOAN_THU`,
`TU_LIEU_DIR`. Tên database mặc định đổi `vcmobilecare` → `thotoi` (docker-compose, CI). Agent SEO Editor vẫn dùng
`VCMC_URL`, `VCMC_API_KEY` (giữ tên để không phá máy đã cài).

## Cách chạy

```bash
cd website && cp .env.example .env   # DATABASE_URL, PAYLOAD_SECRET
npm install
npx payload migrate                   # hoặc npm run dev (tự đồng bộ bảng khi chạy thử)
npm run nap-du-lieu                   # dữ liệu mẫu; khi chạy thử có thêm tài khoản thử, đơn mẫu, đánh giá mẫu
npm run dev                           # http://localhost:3000, /admin, /quan-tri/
npm test && npm run test:tich-hop
BASE_URL=http://localhost:3000 node scripts/vi-du-api.mjs   # chạy lại ví dụ trong api.md
```

### Tài khoản thử (chỉ máy chạy thử, do `nap-du-lieu` tạo)
Mật khẩu chung `ThoToi-ThuNghiem-2026` (đổi bằng `MAT_KHAU_TAI_KHOAN_THU`).

| Email | Vai trò |
|---|---|
| `quantri@thotoi.test` | Quản trị |
| `quanly@thotoi.test` | Quản lý dịch vụ |
| `bientap@thotoi.test` | Biên tập nội dung (VCmedia) |
| `marketing@thotoi.test` | Marketing |
| `dieuphoi@thotoi.test` | Điều phối |

## Quyết định thiết kế frontend cần biết

1. **Danh mục dịch vụ tách khỏi Trang dịch vụ.** `danh-muc-dich-vu` (giá, bật/tắt) và `dich-vu` (bài viết có duyệt) nối
   bằng cùng `slug` (`ac-quy`, `lop`…). Thiết kế dùng đường dẫn khác (`/thay-ac-quy-o-to`); giữ đường dẫn hiện có
   `/dich-vu/<slug>/` để không mất trang đã có, đổi được sau bằng slug.
2. **Báo giá sơ bộ minh bạch theo từng hạng mục**: mỗi hạng mục chọn "luôn có" / "có thể phát sinh" (chỉ cộng vào giá cao) /
   "không tính". Số ra khác số mẫu trong thiết kế `DatLich` (thiết kế là số minh hoạ, không có công thức). Quản lý dịch vụ
   chỉnh được cách tính trong admin. Dịch vụ tắt báo giá sơ bộ (đọc lỗi, cứu hộ) → "Cố vấn gọi lại trong 15 phút".
3. **Khung giờ**: thiết kế `DatLich` dùng 08–10…18–20, `QtBangGia` dùng 07–09…17–19. Chọn bộ của `DatLich` (khách nhìn thấy);
   khung giờ là dữ liệu cấu hình, đổi được trong admin. Chủ nhật nghỉ chiều theo `QtBangGia`.
4. **Địa giới hành chính**: từ 01/07/2025 Hà Nội bỏ cấp quận và sắp xếp lại phường. Thiết kế vẫn dùng 4 quận cũ nên dữ liệu
   theo quận. Google có thể trả tên phường mới không có quận: khi đó cần nhập **ranh giới GeoJSON** cho từng quận
   (`quan.ranhGioi`) để kiểm tra theo toạ độ. **Cần người dùng chốt** danh sách vùng theo địa giới mới.
5. **Link riêng của khách**: token ngẫu nhiên 32 ký tự (`/don/<token>/`), lưu trong đơn (chỉ người xử lý đơn đọc được) để
   gửi lại trong các tin Zalo sau. Hết hạn 24 giờ sau khi đơn hoàn thành hoặc huỷ (410). Số điện thoại luôn che.
6. **Ngoài vùng**: server từ chối tạo đơn (422 `NGOAI_VUNG`) kèm `vung.thongBao`; giao diện mời gọi tư vấn / đặt kéo xe.
   Gọi gấp chỉ nhận trong giờ nhận gấp (mặc định 06:00–22:00).
7. **Đồng ý dữ liệu (NĐ 13/2023)**: không tích thì server không lưu gì; lưu thời điểm đồng ý. Đơn điều phối nhập tay trong
   admin cũng phải tích ô đồng ý (khách đồng ý qua điện thoại).
8. **Video 30 giây**: server không đo được độ dài video (không có ffprobe trong image); giao diện đo bằng thẻ `<video>` rồi gửi
   `thoiLuongVideo`, server chặn theo số đó và theo dung lượng (≤60 MB).
9. **Giới hạn tần suất** nằm trong bộ nhớ một máy chủ. Chạy nhiều máy chủ thì chuyển sang Redis/Postgres.
10. **Mã khuyến mãi, mã giới thiệu**: P0 chỉ lưu vào đơn và dùng để xếp kênh nguồn; kiểm tra hạn, tính giảm là P1/P2.
11. **Bảng "Lịch hẹn" cũ** (form đặt lịch đơn giản) bị thay bằng Đơn hàng; migration xoá bảng cũ (web chưa chạy thật nên
    không có dữ liệu thật). Form `/dat-lich/` hiện là bản tối thiểu nối API mới, chờ frontend dựng lại 4 bước.
12. **Dữ liệu mẫu**: bảng giá, xe (phân khúc), quận, thời gian tới, khung giờ đều là số mẫu của thiết kế, có ghi chú trong
    `du-lieu-mau/*.json` và lý do "Nhập ban đầu từ dữ liệu mẫu thiết kế, cần duyệt" trong nhật ký giá. Hotline, pháp nhân,
    đánh giá, đơn, tài khoản thử chỉ nạp khi chạy thử.

## Chưa làm, và vì sao
- Toàn bộ P1, P2 (phiên 2, 3).
- Màn `/quan-tri/...` theo thiết kế (phiên frontend), backend đã có API cho bảng giá, vùng, giờ.
- Tích hợp thật: chờ thông tin kết nối (bảng trên).
