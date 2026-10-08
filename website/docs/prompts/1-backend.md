# Phiên 1 — Backend ThợTới

Bạn làm **backend** cho website sửa ô tô tận nơi **ThợTới by VC Phồn Vinh**. Một phiên khác sẽ làm frontend
**sau khi bạn xong**, dựa hoàn toàn vào API và tài liệu bạn để lại. Trả lời người dùng bằng tiếng Việt.

## 1. Bối cảnh, đọc trước khi code

- Code nằm trong `website/`: Next.js 16 + **Payload CMS 3** + PostgreSQL, đã chạy được. Đọc `website/README.md`.
  Đã có: bài cẩm nang và trang dịch vụ có duyệt bài, luật kiểm tra bài (`lib/kiem-tra.mjs`), từ khoá SEO,
  nút "AI viết bản nháp" (Claude), lịch hẹn đơn giản, phân quyền 3 vai trò, migration, Docker, CI.
  **Giữ lại** những phần này và mở rộng, không viết lại từ đầu.
- Thiết kế cần phục vụ: `website/docs/thiet-ke/` (đọc `README.md` trong đó trước). Bản gốc:
  https://claude.ai/artifact/RNC9zKN5WvC7ssKZUguJ3z — nếu khác bản sao, theo bản gốc.
  Mỗi màn hình có tiêu đề và mã yêu cầu (FR-xx) trong `canvas.json`. Dữ liệu mẫu trong khối `renderVals()`
  cho biết **mỗi màn cần dữ liệu gì**: đó là hợp đồng dữ liệu bạn phải đáp ứng.
- Mã FR-xx lấy từ tài liệu BA không có trong repo. Có thì người dùng sẽ gửi; không có thì suy ra từ thiết kế.
- Thương hiệu đổi từ "VC Mobile Care" sang **ThợTới**, dòng phụ "by VC Phồn Vinh". Sửa `site.config.mjs` và
  mọi chỗ còn tên cũ.

## 2. Nhánh git

Bắt đầu từ nhánh `claude/stoic-turing-3s70sc` (đã có Payload). Nếu nhánh đó đã được gộp vào `main` thì bắt đầu từ `main`.
Làm trên nhánh phiên này được giao, commit thường xuyên, push khi xong từng phần.

## 3. Việc cần làm

Thứ tự ưu tiên: P0 trước (để frontend làm được trang công khai và đặt lịch), rồi P1, rồi P2.
Mỗi phần xong phải có API chạy được, dữ liệu mẫu, và kiểm thử.

### P0 — Danh mục, bảng giá, vùng phục vụ (dùng chung cho mọi trang)
Một chỗ sửa giá cho cả web (xem `QtBangGia`, `BangGia`, `HangXe`, `XeDien`, `DichVu`, `KhuVuc`):
- **Dịch vụ**: mã (BD, AQ…), tên, đường dẫn, mô tả, thứ tự, bật/tắt nhận đặt lịch, bật/tắt báo giá sơ bộ.
- **Hạng mục giá**: thuộc một dịch vụ; loại *tiền công* (giá cố định, có thể 0 = miễn phí) hoặc *phụ tùng*
  (khoảng giá từ–đến theo **phân khúc xe A/B/C/D**). Có ghi chú hiển thị.
- **Nhật ký đổi giá**: mỗi lần lưu ghi ai sửa, lúc nào, giá cũ, giá mới.
- **Hãng, dòng, đời xe**: dòng xe gán phân khúc A–D, đời từ–đến. Nguồn là VCparts (xem mục 5). Dòng mới chưa gán
  phân khúc thì đánh dấu "cần gán".
- **Phí chung**: phí đi lại trong vùng, phí kiểm tra khi khách từ chối báo giá, bảo hành (6 tháng phụ tùng,
  3 tháng công), cam kết thời gian cứu hộ (60 phút).
- **Báo giá sơ bộ**: API nhận dịch vụ (một hoặc nhiều) + dòng xe (hoặc phân khúc) → tổng khoảng giá
  (gồm phí đi lại), kèm từng dòng. Màn `TrangChuMayTinh`, `DichVu`, `DatLich` dùng.
- **Vùng phục vụ**: quận, phường; trong vùng hay không; thời gian đến dự kiến (phút) theo quận.
  API kiểm tra một địa chỉ hoặc toạ độ: trong vùng không, quận/phường nào, dự kiến bao lâu.
- **Giờ nhận đơn, ngày nghỉ, khung giờ đặt lịch** có giới hạn số đơn mỗi khung (khung đầy hiện gạch ngang trong `DatLich`).
- **Cấu hình chung**: hotline, Zalo OA, pháp nhân, MST, địa chỉ, link đánh giá Google, điểm và số đánh giá Google.
  Chuyển thông tin liên hệ đang có sang đây.
- **Đánh giá khách để hiển thị**: chỉ đánh giá thật, có quận, ngày; gắn được với dịch vụ, quận.

### P0 — Đơn hàng: đặt lịch và gọi gấp (`DatLich`, `GoiGap`)
- **Đơn**: mã dạng `TT-000123`; loại *đặt lịch* hoặc *khẩn cấp* (khẩn cấp lên đầu hàng chờ, báo ngay cho điều phối).
  Dịch vụ (nhiều), triệu chứng, ảnh/video (tối đa 3 ảnh, video 30 giây), xe (hãng, dòng, đời, **biển số chuẩn hoá**
  — gõ liền cũng nhận, tự thêm dấu; số km), vị trí (toạ độ, địa chỉ, quận/phường, trong vùng không), chỗ đỗ
  (nhà, hầm chung cư, bên đường, bãi công ty), ghi chú cho thợ, khung giờ, họ tên, số điện thoại,
  xuất hoá đơn công ty (MST), mã giới thiệu/khuyến mãi, đồng ý xử lý dữ liệu (lưu thời điểm), nhắc bảo dưỡng qua Zalo,
  **nguồn khách** (utm, link giới thiệu, mã QR đối tác), giá sơ bộ lúc đặt.
- **Trạng thái** theo thứ tự trong `TheoDoi`: Đã nhận → Đã xếp thợ → Thợ đang đến → Chờ duyệt báo giá → Đang sửa →
  Chờ thanh toán → Hoàn thành (và Huỷ). Lưu thời điểm từng bước.
- **Link riêng cho khách** (theo dõi, báo giá, thanh toán, đánh giá): token khó đoán, hết hạn 24 giờ sau khi hoàn thành.
  Không ai biết mã đơn mà xem được đơn người khác.
- Chống spam: kiểm tra dữ liệu, giới hạn tần suất theo IP và số điện thoại, ô bẫy bot (như form lịch hẹn đang có).

### P1 — Phục vụ khách sau khi đặt (`TinZalo`, `TheoDoi`, `BaoGia`, `ThanhToan`, `DanhGia`, `TraCuuXe`)
- **Thợ**: tên, ảnh, điểm sao, chứng chỉ VCedu, số năm nghề, biển số xe van, vị trí hiện tại, giờ dự kiến đến.
- **Báo giá chính thức** do thợ/điều phối tạo: hạng mục (tên, lý do, tiền công hay phụ tùng, giá, bắt buộc hay tuỳ chọn,
  mức độ "Cần làm ngay / Nên làm / Có thể để sau", ảnh lỗi). Khách bỏ bớt hạng mục tuỳ chọn rồi đồng ý: lưu thời điểm,
  số điện thoại, **bản chụp nội dung đã duyệt**. Từ chối: đơn kết thúc, chỉ tính phí kiểm tra. Phát sinh thì báo giá mới.
- **Thanh toán VietQR**: tạo nội dung QR (ngân hàng, số tài khoản, số tiền, nội dung = mã đơn), nhận xác nhận tiền về
  từ ngân hàng (webhook), cập nhật đơn ngay; biên nhận (mã giao dịch, thời điểm).
- **Hoá đơn điện tử** và **phiếu bảo hành điện tử** (`BH-xxxxxx`, gắn biển số, hạn theo từng hạng mục).
- **Đánh giá**: link dùng một lần, gửi 24 giờ sau khi xong. 4–5 sao: mời viết trên Google. 1–3 sao: chọn vấn đề, mô tả,
  tạo **phiếu khiếu nại** `KN-xxxxxx` chuyển CSKH, không đăng công khai.
- **Tra cứu lịch sử xe**: nhập biển số → gửi mã 6 số qua Zalo (dự phòng SMS) tới số điện thoại đã dùng khi đặt cho xe đó;
  mã hiệu lực 5 phút, gửi lại sau 45 giây, giới hạn số lần thử; phiên xem tự đóng sau 30 phút. Trả về: xe, km gần nhất,
  các lần sửa (ngày, mã đơn, việc, thợ, km, số tiền, hoá đơn), bảo hành còn lại, mốc bảo dưỡng tiếp theo.
- **Tin Zalo ZNS** (mẫu trong `TinZalo`) gửi tự động sau mỗi bước của đơn; khách không dùng Zalo thì SMS.

### P1 — Quản trị (`QtBaiViet`, `QtBangGia`, `QtMaKhuyenMai`, `QtSoLieu`)
Frontend sẽ dựng các màn quản trị theo thiết kế tại đường dẫn `/quan-tri/...`, dùng phiên đăng nhập của Payload.
Bạn cung cấp API và phân quyền; trang `/admin` mặc định của Payload vẫn giữ để xem dữ liệu thô.
- **Vai trò** theo thiết kế: *Quản trị*; *Quản lý dịch vụ* (sửa giá, danh mục, vùng, giờ, ngày nghỉ; duyệt và đăng bài);
  *Biên tập nội dung (VCmedia)* (viết, sửa, tải ảnh, gửi duyệt; **không** sửa giá, không mở màn bảng giá);
  *Marketing* (mã khuyến mãi, số liệu). Chuyển 3 vai trò đang có sang bộ này.
- **Bài viết và trang**: thêm loại *trang khu vực* (dịch vụ × quận) và *trang hãng xe* bên cạnh bài cẩm nang và trang dịch vụ.
  Trạng thái: Nháp / Chờ duyệt / Đã hẹn giờ / Đã đăng (hẹn giờ đăng tự chạy). Bài cẩm nang có chủ đề
  (Mẹo xe, Bắt bệnh, Xe điện, Mùa vụ), người viết, người duyệt kỹ thuật, thời gian đọc.
  Trong nội dung có **khối giá** lấy từ bảng giá (tự cập nhật khi đổi giá), khối đặt lịch, video YouTube.
  **Tạo trang khu vực từ mẫu**: điền sẵn tiêu đề, khung bài, bảng giá, câu hỏi, thời gian đến của quận; trước khi gửi duyệt
  bắt buộc có đoạn mô tả riêng ≥150 chữ, ≥2 ảnh việc thật tại quận đó, ≥1 đánh giá thật của khách ở quận đó;
  **trùng nội dung quá 70%** với trang khác thì không gửi duyệt được. Thêm các luật này vào `lib/kiem-tra.mjs`.
- **Mã khuyến mãi và mã đối tác**: loại (Khuyến mãi, KOC, Cây xăng, BQL chung cư), đối tác, giảm % (chỉ trên tiền công,
  có mức tối đa) hoặc giảm tiền, ngày bắt đầu, hạn, số lượt tối đa, mỗi số điện thoại dùng 1 lần, % hoa hồng, trạng thái.
  Mã hết hạn/hết lượt tự dừng, khách nhập được báo rõ lý do. Mỗi mã có link đặt lịch điền sẵn mã và ảnh QR (PNG) để in.
  **Báo cáo hoa hồng theo tháng**: chỉ tính đơn đã thanh toán; xuất Excel và CSV kèm danh sách mã đơn.
- **Số liệu**: ghi sự kiện (xem trang, bấm gọi, bấm Zalo, gửi form) kèm nguồn; API cho KPI theo ngày/tuần/tháng có so sánh
  kỳ trước, số đơn theo nguồn, tỷ lệ chuyển đổi so với mục tiêu, top trang (lượt vào, đơn, tỷ lệ), đơn mới nhất kèm nguồn,
  đối soát số đơn với phần mềm điều phối. Xuất Excel. Không ghi dữ liệu cá nhân vào sự kiện.

### P2 — Hội viên, giới thiệu, doanh nghiệp, tuyển thợ (`HoiVien`, `DoanhNghiep`, `TuyenTho`)
- **Gói hội viên** (Cơ bản 490.000đ/năm, An tâm 1.290.000đ/năm, quyền lợi theo bảng so sánh), gắn 1 biển số, hiệu lực
  12 tháng kể từ khi thanh toán (VietQR như trên). Quyền lợi tự áp vào đơn (miễn phí đi lại, giảm % tiền công…).
- **Giới thiệu bạn bè**: mỗi khách một mã riêng (vd. `TUAN2481`), link `?ma=...` tự điền vào form đặt lịch; đếm lượt mở link,
  đơn hoàn thành, lượt miễn phí được thưởng; nhận mã qua Zalo bằng số điện thoại.
- **Yêu cầu báo giá doanh nghiệp**: tên công ty, MST (tra để tự điền tên, địa chỉ), số xe, loại xe, loại đội xe, khu vực bãi,
  người liên hệ, số điện thoại, email, ghi chú, đồng ý dữ liệu → mã `DN-xxxxxx`, giao cho sales B2B.
- **Hồ sơ thợ cộng tác**: họ tên, số điện thoại, năm kinh nghiệm, khu vực, dụng cụ đang có, ≤3 ảnh chứng chỉ,
  đồng ý dữ liệu → mã `TH-xxxxxx`, chuyển nhân sự.

## 4. Hợp đồng API cho frontend (bắt buộc)
- Viết `website/docs/api.md`: mỗi endpoint có đường dẫn, phương thức, ai được gọi, tham số, **ví dụ request và response
  thật** (chạy ra từ server, không viết tay), mã lỗi và câu báo lỗi tiếng Việt.
- Ưu tiên endpoint gọn cho từng màn (vd. `GET /api/trang/dich-vu/:slug` trả đủ thứ trang đó cần) hơn là để frontend tự ghép
  nhiều lệnh. Trang công khai đọc phía server qua Local API thì ghi rõ hàm nào trong `lib/`.
- Chạy `npm run generate:types` để frontend dùng kiểu dữ liệu trong `payload-types.ts`.
- **Dữ liệu mẫu**: mở rộng `npm run nap-du-lieu` để nạp đủ dữ liệu theo thiết kế (dịch vụ, bảng giá A–D, 15 hãng và các
  dòng xe trong `HangXe`/`XeDien`, 4 quận đợt 1 và phường, khung giờ, gói hội viên, vài mã khuyến mãi, vài đơn ở mỗi trạng thái,
  vài thợ). Đánh dấu rõ là dữ liệu mẫu; **không** nạp đánh giá khách mẫu vào chỗ hiển thị công khai khi chạy production.

## 5. Tích hợp bên ngoài: dùng adapter, không giả vờ thành công
Các hệ thống sau chưa có thông tin kết nối: **phần mềm điều phối** (app thợ, vị trí thợ, đối soát đơn), **Zalo ZNS/OA**,
**SMS**, **ngân hàng/VietQR** (webhook tiền về, có thể qua Casso/SePay), **hoá đơn điện tử**, **tra MST**,
**bản đồ/geocoding** (Google Maps), **danh mục xe và phụ tùng VCparts**, **Google Reviews**.
- Mỗi hệ thống một module trong `lib/tich-hop/` với interface rõ ràng và hai bản: bản thật (đọc cấu hình từ biến môi trường)
  và bản **giả lập chỉ dùng khi chạy thử** (ghi log, trả dữ liệu mẫu). Production thiếu cấu hình thì báo lỗi rõ ràng,
  không âm thầm dùng bản giả lập.
- Phía điều phối và app thợ: cung cấp API có khoá (cập nhật trạng thái, vị trí thợ, tạo báo giá, đánh dấu xong) và webhook,
  ghi vào `api.md` để đội VCsoft nối. Điều phối viên cũng phải nhập được báo giá, đổi trạng thái bằng tay trong admin.
- Ghi danh sách biến môi trường mới vào `.env.example`, không bao giờ commit khoá thật.

## 6. Yêu cầu chất lượng
- Dữ liệu cá nhân (số điện thoại, địa chỉ, vị trí, biển số) theo Nghị định 13/2023: chỉ lưu khi khách đã tick đồng ý, lưu
  thời điểm đồng ý; link công khai chỉ hiện số điện thoại đã che (`0912 xxx 345`); API công khai không bao giờ trả dữ liệu
  khách khác.
- Mọi API công khai: kiểm tra đầu vào, giới hạn tần suất, câu báo lỗi tiếng Việt.
- Tiền tính bằng số nguyên đồng (VND), không dùng số thực.
- Mỗi thay đổi cấu trúc bảng có migration (`NODE_ENV=production npm run migrate:create -- <ten>`); kiểm tra migration chạy được
  trên database trống.
- Kiểm thử tự động cho phần tính tiền (báo giá sơ bộ, mã giảm giá, quyền lợi hội viên, hoa hồng), chuẩn hoá biển số,
  kiểm tra vùng phục vụ, luồng trạng thái đơn, phân quyền từng vai trò. Thêm vào CI (`.github/workflows/website.yml`).
- Trước mỗi lần push: `npm run typecheck`, kiểm thử, `npm run build`, và chạy thử server gọi các API chính.
- Không gọi Claude API thật khi kiểm thử (tốn tiền) trừ khi người dùng đồng ý.

## 7. Khi xong: bàn giao
- Viết `website/docs/BAN-GIAO-BE.md`: đã làm gì, chưa làm gì và vì sao, danh sách adapter đang ở chế độ giả lập, biến môi
  trường cần điền, cách chạy, tài khoản thử cho từng vai trò (chỉ ở máy chạy thử), các quyết định thiết kế frontend cần biết.
- Push nhánh, rồi **báo người dùng tên nhánh** để họ dán vào prompt frontend.
- Không tự mở pull request trừ khi người dùng yêu cầu.

Gặp chỗ thiết kế mâu thuẫn hoặc thiếu thông tin: chọn cách hợp lý nhất, ghi lại trong `BAN-GIAO-BE.md`, làm tiếp.
Chỉ hỏi người dùng khi không thể tự quyết (vd. chính sách tiền, pháp lý).
