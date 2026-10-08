# Bàn giao frontend ThợTới

Nhánh: `claude/determined-johnson-3cs52p` (dựng trên nhánh backend `claude/youthful-hawking-7jm5p2`).
Làm theo `docs/prompts/2-frontend.md`, thiết kế `docs/thiet-ke/` (bản gốc https://claude.ai/artifact/RNC9zKN5WvC7ssKZUguJ3z).
Backend: `docs/BAN-GIAO-BE.md`, hợp đồng API: `docs/api.md`.

## Đường dẫn từng màn

### Trang công khai (`app/(frontend)/(trang)/`: header, footer, thanh liên hệ dưới đáy điện thoại)
| Thiết kế | Đường dẫn | File chính |
|---|---|---|
| `Main` + `TrangChuMayTinh` | `/` | `page.jsx`, `components/trang/*` |
| `DichVu` | `/dich-vu/[slug]/` | `dich-vu/[slug]/page.jsx` |
| `KhuVuc` | `/dich-vu/[slug]/[quan]/` | `dich-vu/[slug]/[quan]/page.jsx` (chỉ khi trang khu vực đã đăng; nháp xem qua `/xem-truoc/`) |
| `HangXe` | `/hang-xe/[hang]/` (`?dong=`) | `hang-xe/[hang]/page.jsx`, `ChonDongXe.jsx` |
| `XeDien` | `/xe-dien/` | `xe-dien/page.jsx`, `ChonXeDien.jsx` |
| `BangGia` | `/bang-gia/` (`?phanKhuc=A–D`) | `bang-gia/page.jsx`, `components/trang/BangGiaDayDu.jsx` |
| `HoiVien` | `/hoi-vien/` | `hoi-vien/page.jsx`, `components/p2/*` |
| `DoanhNghiep` | `/doanh-nghiep/` | `doanh-nghiep/page.jsx`, `components/p2/FormDoanhNghiep.jsx` |
| `TuyenTho` | `/tuyen-tho/` | `tuyen-tho/page.jsx`, `components/p2/FormTuyenTho.jsx` |
| `VeChungToi` | `/ve-chung-toi/` | `ve-chung-toi/page.jsx`, `lib/ve-chung-toi.ts` |
| `CamNang` | `/cam-nang/` (`?chuDe=&q=&trang=`) | `cam-nang/page.jsx`, `components/noi-dung/*` |
| `BaiViet` | `/cam-nang/[slug]/` | `cam-nang/[slug]/page.jsx` |
| `TraCuuXe` | `/tra-cuu-xe/` | `tra-cuu-xe/page.jsx`, `components/phuc-vu/TraCuuXe.jsx` |
| `Loi404` | mọi đường dẫn lạ, `notFound()` | `app/global-not-found.jsx`, `(trang)/not-found.jsx`, `(frontend)/not-found.jsx`, `components/trang/Loi404.jsx` |
| (không có thiết kế) | `/chinh-sach-bao-hanh/`, `/chinh-sach-du-lieu/` | footer trỏ tới; **nội dung pháp lý cần người có thẩm quyền duyệt** |

### Luồng đơn hàng (`app/(frontend)/(don)/`: khung điện thoại 480px, máy tính canh giữa)
| Thiết kế | Đường dẫn | File chính |
|---|---|---|
| `DatLich` | `/dat-lich/` (`?dv=a,b`, `?ma=`, `?hang=&dong=&doi=`) | `dat-lich/page.jsx`, `components/don/DatLich.jsx` |
| `GoiGap` | `/goi-gap/` | `goi-gap/page.jsx`, `components/don/GoiGap.jsx` |
| `TheoDoi` | `/don/[token]/` (hỏi lại 30 giây, dừng khi ẩn tab) | `components/phuc-vu/TheoDoiDon.jsx` |
| `BaoGia` | `/don/[token]/bao-gia/` | `components/phuc-vu/BaoGiaDon.jsx` |
| `ThanhToan` | `/don/[token]/thanh-toan/` (hỏi lại 5 giây, tự sang biên nhận) | `components/phuc-vu/ThanhToanDon.jsx` |
| `DanhGia` | `/don/[tokenDanhGia]/danh-gia/` | `components/phuc-vu/DanhGiaDon.jsx` |
| (api.md mục 8) | `/hoi-vien/thanh-toan/[token]/`, `/gioi-thieu/[token]/` | `components/p2/ThanhToanHoiVien.jsx` |
| `TinZalo` | không phải trang. Link trong `lib/don/tin-nhan.ts` đã kiểm: trỏ đúng các màn trên | |

Link riêng (`/don/`, `/hoi-vien/thanh-toan/`, `/gioi-thieu/`) luôn noindex, không vào sitemap.

### Quản trị (`app/(quan-tri)/`: root layout riêng, phiên đăng nhập Payload, luôn noindex)
| Thiết kế | Đường dẫn |
|---|---|
| `QtBaiViet` | `/quan-tri/bai-viet/` |
| `QtBangGia` | `/quan-tri/bang-gia/?tab=bang-gia\|dich-vu\|hang-xe\|vung\|gio\|nhat-ky` |
| `QtMaKhuyenMai` | `/quan-tri/ma-khuyen-mai/` (`?thang=` cho hoa hồng) |
| `QtSoLieu` | `/quan-tri/so-lieu/?ky=ngay\|tuan\|thang` |

Chưa đăng nhập → 307 sang `/admin/login?redirect=…`. Menu theo vai trò (`lib/quan-tri/phien.js`, bảng `QUYEN`); vào thẳng URL màn
không có quyền thì hiện "Bạn không có quyền…". Phân quyền thật vẫn ở backend. "Tổng quan" trỏ `/quan-tri/` (bảng điều khiển cũ),
"Lịch hẹn" trỏ `/admin/collections/don-hang`.
**Soạn bài: mở sang `/admin`** (nút "Mở trình soạn thảo", "Viết bài mới"); `/quan-tri/bai-viet/` lo danh sách, kiểm tra SEO, gửi
duyệt, trả lại kèm góp ý, duyệt & đăng, hẹn giờ, tạo trang khu vực từ mẫu. Dựng lại trình soạn thảo Lexical quá tốn công.

## Phần nền dùng chung

- `app/(frontend)/globals.css`: biến màu theo thiết kế (`--toi #13283f`, `--nhan #c2410c`, `--nen #f6f7f9`, `--chu #18212c`,
  `--chu-phu #5a6575`, `--vien #e1e5ea`, `--nhan-nhat #fff1e6`, `--zalo #0068ff`…) và lớp tiện dụng (`.wrap`, `.khoi`, `.nut-*`,
  `.bao-*`). Component dùng CSS Modules cạnh file. Quản trị thêm biến `--qt-*` trong `components/quan-tri/nen-quan-tri.css`.
- `components/chung/`: `Header` (menu điện thoại bằng `<details>`, chạy khi tắt JS), `Footer`, `ThanhLienHe`, `LienHe`, `DauDon`,
  `Form` (`TruongNhap`, `ODongY`, ô bẫy bot), `KhungAnh` (ảnh CMS hoặc khung giữ chỗ), `DuongDan` (breadcrumb + JSON-LD),
  `ChonXe`, `DanhGiaKhach`, `TheoDoiSuKien`.
- `lib/giao-dien.js` (`layChung()` cho header/footer), `lib/tel.js` (thuần, dùng được ở client component).
- **Không import `lib/giao-dien.js`, `lib/cms.js` hay `components/chung/LienHe.jsx` trong client component**: chúng kéo Payload và
  `next/headers` vào bundle trình duyệt, build hỏng (lỗi `build-manifest.json ENOENT`).
- Số liệu: `lib/su-kien-client.js` ghi xem trang, bấm gọi/Zalo (tự bắt mọi link `tel:` và zalo), gửi form → `POST /api/su-kien/ghi`
  bằng `sendBeacon`. Nguồn khách (utm, `?ma=`, `qr`, trang vào, referrer) giữ trong `sessionStorage` suốt phiên và gửi kèm đơn
  (`nguon`). `?ma=` ở mọi trang: lưu mã, gọi `POST /api/gioi-thieu/mo`, điền sẵn ô mã ở form đặt lịch.

## Địa giới hành chính mới

Tên khu vực ở mọi màn (hero, khối vùng phục vụ, footer, JSON-LD `areaServed`, đặt lịch, gọi gấp, quản trị) lấy từ dữ liệu vùng phục
vụ (`quan` trong CMS, `vungPhucVu.quan[].ten`), không gõ cứng. Chữ hiển thị dùng "khu vực" thay cho "quận" (ô nhập "Gõ địa chỉ hoặc
tên phường"). Khi chuyển sang phường: nhập danh sách khu vực mới (và ranh giới GeoJSON nếu cần kiểm tra theo toạ độ) trong admin là
giao diện đổi theo. Đường dẫn trang khu vực vẫn là `/dich-vu/<dịch vụ>/<slug khu vực>/`.

## Khác thiết kế và vì sao

**Chung**
- Bỏ hết chữ "bản mẫu", nút "Mô phỏng…", "Xem lại form (bản mẫu)". Thay bằng hành vi thật.
- Số liệu trong thiết kế (hotline, 60 phút, 6/3 tháng, giá, pháp nhân, 4 quận, đánh giá) đều lấy từ dữ liệu. Câu hứa không có trong
  dữ liệu bị bỏ hoặc viết lại ("gọi lại trong 5 phút", "thợ cách 3,2 km" → thời gian tới của khu vực).
- Ảnh: chưa có ảnh thật nên hiện khung giữ chỗ (không dùng ảnh mạng). Đã xoá ảnh minh hoạ tạm `public/anh/tam/`.
- Bản đồ: chưa có khoá nên là khung giữ chỗ liệt kê khu vực và thời gian tới; đặt `GOOGLE_MAPS_EMBED_KEY` thì nhúng Google Maps.

**Trang công khai**
- Trang chủ, 404 chỉ hiện dịch vụ đã có trang dịch vụ đăng (danh mục có "Điều hoà" nhưng chưa có trang).
- Hãng xe: mở cho mọi hãng có dòng xe (để khách tra giá); hãng chưa có bài "Trang hãng xe" đã đăng thì noindex, không vào sitemap,
  khối "Lỗi hay gặp" ẩn. "Phụ tùng thợ mang theo" lấy hạng mục phụ tùng trong bảng giá (chưa có mã VCparts). Giá gợi ý theo báo giá
  sơ bộ của dịch vụ bảo dưỡng theo phân khúc, không theo công thức cấp nhỏ/lớn gõ cứng trong thiết kế.
- Dịch vụ: "Dấu hiệu…", "Thợ làm những gì" lấy từ nội dung CMS; thêm khối đánh giá thật; chip khu vực chỉ là link khi trang khu vực
  đã đăng.
- Bảng giá: nhóm dịch vụ dùng `<details>` (đọc được khi tắt JS).
- Về chúng tôi: chỉ hiện con số thật (số xe đã phục vụ khi ≥100), đội thợ từ collection `tho`.
- Xe điện: bỏ nhãn "Đã được pháp chế duyệt"; câu "không ảnh hưởng bảo hành hãng" giữ, **cần pháp chế duyệt**.
- Doanh nghiệp: không in giá theo xe và mức giảm theo số xe (giá mẫu, chưa thành dữ liệu — BAN-GIAO-BE mục 23): bảng liệt kê loại
  xe với nút "Nhận báo giá". Bỏ khối "Khách hàng tiêu biểu" (logo, lời chứng thực mẫu). Loại đội xe chọn một (API nhận một giá trị).
- Hội viên: không hiện mã giới thiệu ngay trên trang (BAN-GIAO-BE mục 21) — mã xem qua link riêng `/gioi-thieu/<token>/` trong tin
  Zalo. Mã gói là `HV-`, không phải `TT-`. Đăng ký xong có nút "Thanh toán ngay".
- Bài viết: thông tin người viết/duyệt chỉ hiện khi có (Users chưa có chức danh); ảnh đầu bài là khung giữ chỗ (`cam-nang` chưa có
  trường ảnh); khối "Đèn trên xe bạn đang thế nào" riêng của bài mẫu không làm.
- Tuyển thợ: tỷ lệ công 50% là hằng `TY_LE_THO` trong trang (chưa có cấu hình).

**Luồng đơn**
- Đặt lịch: mặc định chưa chọn gì (thiết kế chọn sẵn ắc quy, hầm, 8–10h); `?dv=` chọn sẵn được. Nút xám vẫn bấm được để báo lỗi
  cạnh ô và đưa con trỏ tới. Nhập MST thì tự điền tên công ty. Màn xong có bảng khung giờ, khu vực + thời gian tới, giá sơ bộ, mã.
- Gọi gấp: `h1` là tiêu đề trên header; ngoài giờ nhận gấp hiện hộp đỏ + hotline, khoá nút gửi.
- Theo dõi: API không trả số thợ (cố ý) → hai nút "Gọi tổng đài", "Nhắn tổng đài". Bản đồ là hình minh hoạ + nút mở Google Maps
  theo toạ độ thật của thợ.
- Báo giá: thêm ô bắt buộc "Tôi đồng ý báo giá…" (API cần `dongY`); từ chối có bước xác nhận + lý do.
- Thanh toán: "Xong <giờ>" thay "Duyệt lúc" (API không trả giờ duyệt); nút hoá đơn/PDF chỉ hiện khi có link (adapter giả lập trả null).
- Đánh giá: 4–5 sao cần bấm "Gửi đánh giá" (tránh gửi khi lỡ chạm sao); sao là radio thật.
- Tra cứu xe: bỏ ô "Nhắc tôi qua Zalo trước 7 ngày" (backend chưa có việc định kỳ nhắc bảo dưỡng).

**Quản trị**
- Menu thống nhất kiểu thẻ trắng (thiết kế có 2 kiểu). Hộp chọn vai trò mẫu → hộp "Quyền của bạn".
- Bảng giá chia tab theo `?tab=` (thiết kế là trang dài); không có ô giá gói hội viên; bảo hành chỉ xem; bỏ ô "Ngày nghỉ vẫn nhận gọi
  gấp" (không có trường dữ liệu); thêm đợt nghỉ theo khoảng ngày.
- Số liệu: top trang chỉ có đường dẫn (không có tiêu đề); đối soát hiện "chưa kết nối" khi điều phối chưa nối.

## Sửa backend trong phiên này
- `lib/don/theo-doi.ts`: thêm `tenSuCo`, `giaSoBo.hienThi`, `linkDanhGia`, `viecCanLam: "danhGia"` (đã ghi `api.md`).
- `collections/NhatKyGia.ts`: `GET /api/nhat-ky-gia/xuat?dinhDang=xlsx|csv` (đã ghi `api.md`).
- `lib/cong-khai.ts` `tomTatCong`: bỏ hạng mục tính theo đơn vị khi có giá trọn gói ("Giá công từ" cứu hộ 400.000đ, không phải 15.000đ/km).
- `lib/ve-chung-toi.ts`: số đơn hoàn thành, đội thợ đang hoạt động (chỉ trường công khai).
- `lib/cms.js` `layDanhSachBai`: thêm `chuDe`, `thoiGianDocPhut`. `lib/noi-dung.ts`: nút khối đặt lịch thêm lớp `nut nut-chinh`.
- `lib/don/tao-don.ts`: mã từ link `?ma=` đã dùng làm mã khuyến mãi thì không báo thêm "Không có mã giới thiệu này".
- `scripts/nap-du-lieu.ts`: `NAP_DU_LIEU_THU=1` nạp tài khoản và dữ liệu thử cả khi `NODE_ENV=production` (máy e2e, CI).
- `next.config.mjs`: `experimental.globalNotFound` (app có 2 layout gốc). `.env.example`: `GOOGLE_MAPS_EMBED_KEY`.

## Kiểm thử

```bash
# cửa sổ 1: database trống → bản build
export NODE_ENV=production TICH_HOP_GIA_LAP=tat-ca NAP_DU_LIEU_THU=1
npm run migrate && npm run nap-du-lieu && npm run build && npm start
# cửa sổ 2
npm run test:e2e            # Playwright, Chromium (máy cloud có sẵn ở /opt/pw-browsers)
node scripts/tao-don-thu.mjs # tạo 9 đơn ở mọi trạng thái, in link /don/... để mở tay
node scripts/chup-man-hinh.mjs / /bang-gia/ --rong=390 --ra=/tmp/anh   # chụp để so với thiết kế
```

`tests/e2e/` (19 ca, chạy trong CI sau bước build): trang chủ và bảng giá ở 390px và 1440px (một h1, không cuộn ngang, đổi phân
khúc), kiểm tra khu vực, trang dịch vụ, 404; đặt lịch đủ 4 bước; gọi gấp; theo dõi đơn; duyệt báo giá bỏ bớt hạng mục; thanh toán
(ngân hàng giả lập) tự sang biên nhận; đánh giá 2 sao tạo KN; tra cứu xe với mã giả lập (cả mã sai); link sai/hết hạn; quản trị chưa
đăng nhập; Quản lý dịch vụ sửa giá → thấy giá mới ở trang dịch vụ, trang khu vực (qua xem trước, vì trang khu vực mẫu là nháp), form
đặt lịch, nhật ký giá, rồi trả giá cũ; Biên tập không vào được màn bảng giá (cả API); Marketing tạo mã cây xăng → khách đặt lịch bằng
`?ma=`. Kết quả lần chạy cuối: **19/19 đạt**. `npm test` 41/41, `npm run test:tich-hop` đạt, `typecheck`, `build` sạch.

Mỗi lần chạy e2e dùng một IP giả (`X-Forwarded-For`) vì server giới hạn 5 đơn/10 phút mỗi IP, và trước khi chạy nâng "Số đơn tối
đa" mỗi khung giờ lên 1000 (`tests/e2e/chuan-bi.mjs`) để lịch 4 ngày tới không bị kín sau nhiều lần chạy: chỉ chạy trên database kiểm thử.

## Việc còn lại
1. **Người dùng chốt**: danh sách khu vực theo địa giới mới; nội dung 2 trang chính sách và câu bảo hành hãng ở trang xe điện.
2. **Trang 404 khi gọi `notFound()`** (dịch vụ, bài, khu vực không có): mã HTTP 404 đúng, nhưng Next 16.3.5 trả HTML vỏ lỗi
   (`__next_error__`), giao diện 404 chỉ hiện sau khi JavaScript chạy. Đã tái hiện trên app Next tối giản một layout gốc: lỗi của
   framework, không phải code. Đường dẫn không khớp trang nào thì `global-not-found` render đủ phía server. Theo dõi bản Next mới.
   Trang 404 toàn cục render lúc có request (`await connection()`), nên build không cần database (build trong Docker).
3. **Dữ liệu chưa có**: ảnh thật (dịch vụ, khu vực, xưởng, thợ), ảnh đại diện bài cẩm nang, trang hãng xe đã đăng, trang khu vực đã
   đăng (mẫu đang nháp vì thiếu ảnh thật và đánh giá thật), chủ đề cho bài mẫu, chức danh người duyệt kỹ thuật, giá doanh nghiệp theo
   xe (cần global mới), tỷ lệ công thợ, khoá Google Maps nhúng.
4. **Backend nên làm thêm**: nhắc bảo dưỡng qua Zalo (màn tra cứu xe), link hoá đơn thật; `api.md` ghi lỗi `KHONG_CO_XE` nhưng code
   trả `CHUA_CO_LICH_SU`; màn link sai/hết hạn và màn "không có quyền" ở quản trị đang trả HTTP 200 (có noindex).
5. **Bảo mật cần xem khi triển khai**: `ipCua()` (`lib/api/chung.ts`) tin phần đầu của `X-Forwarded-For`. Proxy phía trước phải ghi đè
   header này, nếu không khách tự đặt header là vượt được giới hạn tần suất.
6. Video ≤30 giây ở form đặt lịch: đo bằng thẻ `<video>` đã viết nhưng chưa thử với tệp video thật.
