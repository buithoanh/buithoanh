# Tư liệu transcript

Chữ lấy từ video TikTok bằng TIKTIKTOTEXT (VCwiki, repo GitLab `vcwiki/tiktok-to-text`).
Agent **SEO Editor** và **Content Pipeline** dùng làm tư liệu: học câu hỏi thật của khách, cách mở đầu, nhịp, lời kêu gọi.
**Không chép nguyên văn**: CMS (mỗi lần lưu bài) và `npm run kiem-tra` báo lỗi khi bài có đoạn từ 12 chữ liên tiếp giống hệt tư liệu mà bài dẫn nguồn; bài còn lỗi không đăng được.

## ⚠️ Repo này đang công khai
Transcript là lời của người khác. Chỉ đưa vào đây:
- transcript video của chính VCPV, hoặc
- bản **tóm tắt ý** (không chép lời) của video người khác.

Bản transcript đầy đủ của kênh khác thì để ngoài repo (trên máy, hoặc trong VCwiki), rồi trỏ tới bằng biến môi trường:
`TU_LIEU_DIR=/đường/dẫn/transcript` (đặt trong `website/.env` của server, hoặc khi chạy `npm run kiem-tra`)

## Định dạng: `tu-lieu/transcript/<slug>.md`
Xem `transcript/_mau.md` (file bắt đầu bằng `_` bị bỏ qua).

| Trường | Bắt buộc | Ý nghĩa |
|---|---|---|
| `link` | có | Link video gốc |
| `kenh` | có | Tên kênh, ví dụ `@garaxyz` |
| `tieuDe` | có | Tiêu đề hoặc câu mở đầu của video |
| `ngayLay` | có | Ngày lấy transcript (YYYY-MM-DD) |
| `chuDe` | có | Danh sách chủ đề, trùng tên nhóm từ khoá trong CMS (SEO → Từ khoá; danh sách gốc ở `website/du-lieu-mau/ke-hoach-seo.json`) (Ắc quy, Lốp, …) |
| `loai` | có | `cua-minh` (video VCPV) hoặc `tom-tat` (tóm tắt ý video người khác) |
| `ngayDang`, `luotXem`, `luotThich` | không | Số liệu của video |
| `cauHoiKhach` | không | Câu hỏi khách hỏi trong video hoặc bình luận, dùng làm FAQ |

Thân file: lời nói, mỗi câu một dòng, có mốc thời gian dạng `[00:03]`.

## Bài và kịch bản dẫn nguồn thế nào
- Bài website: điền ô **Tư liệu đã dùng** (slug) trong bài ở CMS, hoặc gửi `tuLieu: [<slug>]` khi agent tạo bản nháp qua API. Trang quản trị (`/quan-tri/`) hiện tư liệu nào đã dùng, chưa dùng.
- Kịch bản video: ghi slug tư liệu vào `output/<ten>/nguon.txt`.

## Lấy từ TIKTIKTOTEXT
TIKTIKTOTEXT chạy trên máy anh Thọ Anh (`/Users/apple/projects/TIKTIKTOTEXT`, FastAPI + React).
Khi có quyền đọc mã, viết script xuất thẳng ra định dạng trên. Trước đó, xuất tay: mỗi video một file.

## Tư liệu gom theo dịch vụ: `tu-lieu/dich-vu/<slug>.md`
Agent **Research Gatherer** ghi ở đây: triệu chứng, nguyên nhân, quy trình, câu hỏi khách hay hỏi của từng dịch vụ, **tóm
tắt bằng lời của mình**, mỗi ý kèm nguồn `document_id · [mm:ss] · kênh` trong kho VCWIKI (MCP `vc-content`). Không chép đoạn
transcript của kênh khác vào. Agent **SEO Planner** và **SEO Editor** đọc thư mục này. Hướng dẫn dùng kho và danh sách
kênh: `agent-web-sua-chua-nhanh.md`.
