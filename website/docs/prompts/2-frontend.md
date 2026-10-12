# Phiên 2 — Frontend ThợTới, rồi ghép với Backend

Bạn làm **frontend** cho website sửa ô tô tận nơi **ThợTới by VC Phồn Vinh**, dựng đúng theo thiết kế, nối vào backend
mà phiên trước đã làm xong. Cuối phiên, bạn ghép và kiểm tra toàn bộ. Trả lời người dùng bằng tiếng Việt.

## 1. Nhánh git

Bắt đầu từ **nhánh backend** người dùng ghi ở cuối tin nhắn (dạng `claude/...`). Nhánh đó đã có toàn bộ backend, nên làm
frontend trên nền nó thì việc ghép chỉ còn là kiểm tra và sửa chỗ lệch. Làm trên nhánh phiên này được giao.
Người dùng chưa ghi tên nhánh thì hỏi lại, đừng bắt đầu từ `main`.

## 2. Đọc trước khi code

1. `website/docs/BAN-GIAO-BE.md`: backend đã làm gì, chưa làm gì, adapter nào đang giả lập.
2. `website/docs/api.md`: hợp đồng API. **Chỉ dùng endpoint có trong đây.** Thiếu dữ liệu cho một màn thì xem mục 6.
3. `website/payload-types.ts`: kiểu dữ liệu.
4. Thiết kế: `website/docs/thiet-ke/` (đọc `README.md` trong đó trước). Bản gốc:
   https://claude.ai/artifact/RNC9zKN5WvC7ssKZUguJ3z — nếu khác bản sao, theo bản gốc.
5. `website/README.md` và code hiện có trong `app/(frontend)/`, `components/`.

## 3. Dựng theo thiết kế

Mỗi file `*.dc.html` là một màn hình: bố cục và style nằm trong `<x-dc>`, hành vi tương tác nằm trong
`<script type="text/x-dc">` (`renderVals()` cho biết dữ liệu nào, `this.state` cho biết trạng thái nào thay đổi khi bấm).

- **Giữ đúng giao diện**: màu, font Be Vietnam Pro, cỡ chữ, khoảng cách, bo góc, thứ tự nội dung, chữ trên nút.
  Màu chính: nền tối `#13283f`, nhấn cam `#c2410c`, nền `#f6f7f9`, chữ `#18212c`, chữ phụ `#5a6575`, viền `#e1e5ea`,
  nền cam nhạt `#fff1e6`, Zalo `#0068ff`. Đưa các giá trị này thành biến CSS dùng chung, không rải mã màu khắp nơi.
- **Không chép nguyên style inline** từ thiết kế. Viết thành component tái dùng (header, thanh liên hệ dưới đáy, thẻ dịch vụ,
  bảng giá, chọn phân khúc, chọn xe, form có ô đồng ý dữ liệu, footer…) với CSS riêng (CSS Modules hoặc file CSS theo
  component). Có thể bỏ `globals.css` cũ nếu thay thế được hết.
- **Responsive**: thiết kế điện thoại rộng 390px là chuẩn. Trên máy tính, trang chủ theo `TrangChuMayTinh`; các trang khác
  tự co giãn hợp lý (nội dung tối đa ~1200px, lưới nhiều cột). Không cuộn ngang ở 360px.
- **Dữ liệu thật từ backend**, không gõ cứng giá, danh sách dịch vụ, quận, hãng xe, hotline. Mọi giá lấy từ bảng giá chung.
- Chữ "bản mẫu", nút "Mô phỏng…", "Xem lại form (bản mẫu)", "Bản mẫu: xem khi vị trí ngoài vùng" trong thiết kế chỉ để
  duyệt bố cục: **không đưa lên web thật**. Thay bằng hành vi thật.
- Ảnh đang là khung trống: dùng ảnh từ CMS nếu có, chưa có thì hiện khung giữ chỗ gọn gàng, không dùng ảnh mạng.

## 4. Danh sách màn hình và đường dẫn

Trang công khai (đặt lại đường dẫn nếu `api.md` đã quy định khác):
| Thiết kế | Đường dẫn |
|---|---|
| `Main` (điện thoại) + `TrangChuMayTinh` (máy tính) | `/` |
| `DichVu` | `/dich-vu/[slug]/` |
| `KhuVuc` | `/dich-vu/[slug]/[quan]/` |
| `HangXe` | `/hang-xe/[hang]/` (chọn dòng, đời, bảng giá đổi theo) |
| `XeDien` | `/xe-dien/` |
| `BangGia` | `/bang-gia/` |
| `HoiVien` | `/hoi-vien/` |
| `DoanhNghiep` | `/doanh-nghiep/` |
| `TuyenTho` | `/tuyen-tho/` |
| `VeChungToi` | `/ve-chung-toi/` |
| `CamNang` | `/cam-nang/` (lọc chủ đề, tìm kiếm, xem thêm) |
| `BaiViet` | `/cam-nang/[slug]/` (mục lục, khối giá, khối đặt lịch, video YouTube chỉ tải khi bấm phát) |
| `Loi404` | trang 404 |

Luồng đơn hàng (giao diện điện thoại, máy tính thì canh giữa):
| Thiết kế | Đường dẫn |
|---|---|
| `DatLich` | `/dat-lich/` — 4 bước, giá sơ bộ cập nhật theo lựa chọn, nhận `?ma=` và `?dv=` để điền sẵn |
| `GoiGap` | `/goi-gap/` — lấy vị trí bằng trình duyệt, báo ngoài vùng |
| `TheoDoi` | `/don/[token]/` — tự cập nhật (hỏi lại mỗi 30 giây hoặc theo cách `api.md` quy định) |
| `BaoGia` | `/don/[token]/bao-gia/` |
| `ThanhToan` | `/don/[token]/thanh-toan/` — QR VietQR, sao chép từng dòng, tự chuyển sang biên nhận khi tiền về |
| `DanhGia` | `/don/[token]/danh-gia/` |
| `TraCuuXe` | `/tra-cuu-xe/` — biển số → mã Zalo → lịch sử |
| `TinZalo` | không phải trang web: là mẫu tin Zalo do backend gửi. Chỉ kiểm tra link trong tin trỏ đúng trang ở trên. |

Quản trị (máy tính, dùng phiên đăng nhập Payload; chưa đăng nhập thì chuyển tới trang đăng nhập):
| Thiết kế | Đường dẫn |
|---|---|
| `QtBaiViet` | `/quan-tri/bai-viet/` |
| `QtBangGia` | `/quan-tri/bang-gia/` (các tab: bảng giá, danh mục dịch vụ, hãng & đời xe, vùng phục vụ, giờ nhận đơn & ngày nghỉ, nhật ký giá) |
| `QtMaKhuyenMai` | `/quan-tri/ma-khuyen-mai/` |
| `QtSoLieu` | `/quan-tri/so-lieu/` |
Menu bên trái theo thiết kế; mục nào thiết kế chưa vẽ (Tổng quan, Lịch hẹn) thì trỏ tạm sang trang tương ứng trong `/admin`.
Ẩn hoặc khoá đúng theo vai trò (Biên tập không thấy màn bảng giá, không sửa được giá). Phân quyền thật nằm ở backend;
frontend chỉ ẩn cho gọn, không coi đó là bảo mật. Soạn bài trong `/quan-tri/bai-viet/` dùng trình soạn thảo của Payload
hoặc mở bài sang `/admin` nếu dựng lại trình soạn thảo quá tốn công; ghi lựa chọn vào bàn giao.

## 5. Yêu cầu chất lượng

- **SEO** (đang là web SEO): mỗi trang có title, description, canonical, dữ liệu có cấu trúc (AutoRepair, Service, FAQPage,
  Article, BreadcrumbList) như code hiện có; một `h1` mỗi trang; sitemap gồm các trang mới; trang công khai render phía server
  (đọc được khi tắt JavaScript), chỉ phần tương tác mới chạy phía trình duyệt. Giữ cơ chế chặn Google khi chưa có tên miền.
- **Tốc độ trên điện thoại 4G**: ít JavaScript ở trang công khai, ảnh có kích thước và lazy-load, font tải `display=swap`.
- **Dễ dùng**: nút và ô bấm cao tối thiểu 44px; mọi ô nhập có `<label>`; nút chỉ có icon có `aria-label`; dùng được bằng bàn
  phím; tương phản chữ đạt 4.5:1.
- **Form**: kiểm tra ngay khi nhập, báo lỗi tiếng Việt cạnh ô, không mất dữ liệu đã nhập khi gửi lỗi; ô đồng ý dữ liệu bắt buộc
  như thiết kế; chống bấm gửi hai lần.
- **Ghi sự kiện số liệu** (bấm gọi, bấm Zalo, gửi form, xem trang) đúng API backend, giữ nguồn khách (utm, `?ma=`) suốt phiên.
- Trước mỗi lần push: `npm run typecheck`, `npm run build`, chạy server với dữ liệu mẫu (`npm run nap-du-lieu`) và mở thử.

## 6. Khi backend thiếu thứ gì

Đừng gõ cứng dữ liệu cho xong. Theo thứ tự:
1. Đọc lại `api.md` và `BAN-GIAO-BE.md`, có thể có dưới tên khác.
2. Thiếu thật và sửa nhỏ (thêm trường vào kết quả trả về, thêm endpoint đọc đơn giản): tự sửa backend, viết thêm vào `api.md`,
   ghi vào bàn giao.
3. Thiếu lớn (logic tiền, phân quyền, tích hợp ngoài): dựng giao diện với trạng thái "chưa có dữ liệu", ghi vào bàn giao,
   báo người dùng.

## 7. Ghép và kiểm tra cuối (làm trong phiên này)

1. Lấy bản backend mới nhất về (nếu nhánh backend có commit mới thì merge vào), sửa xung đột.
2. Database trống → `npm run migrate` → `npm run nap-du-lieu` → `npm run build` → `npm start`.
3. Viết kiểm thử end-to-end bằng Playwright (Chromium có sẵn ở `/opt/pw-browsers`, không chạy `playwright install`) cho các
   luồng: xem trang chủ và bảng giá trên khổ 390px và 1440px; đặt lịch đủ 4 bước; gọi gấp; mở link đơn, duyệt báo giá bỏ bớt
   hạng mục; thanh toán (dùng adapter ngân hàng giả lập); đánh giá 2 sao tạo phiếu khiếu nại; tra cứu xe với mã giả lập;
   đăng nhập quản trị, sửa một giá và thấy giá mới trên trang dịch vụ, trang khu vực, form đặt lịch; Biên tập không vào được
   màn bảng giá; tạo mã khuyến mãi và dùng nó khi đặt lịch. Thêm vào CI.
4. Chụp màn hình từng trang ở 390px, đặt cạnh thiết kế, sửa chỗ lệch rõ rệt.
5. Viết `website/docs/BAN-GIAO-FE.md`: đường dẫn từng màn, chỗ nào khác thiết kế và vì sao, việc còn lại.
   Cập nhật `website/README.md` cho đúng hiện trạng.
6. Push nhánh, báo người dùng kết quả kiểm thử thật (đạt/không đạt, kèm lỗi). Hỏi người dùng có muốn mở pull request không;
   không tự mở.
