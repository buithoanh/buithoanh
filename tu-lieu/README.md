# Tư liệu transcript

Chữ lấy từ video TikTok bằng TIKTIKTOTEXT (VCwiki, repo GitLab `vcwiki/tiktok-to-text`).
Agent **SEO Editor** và **Content Pipeline** dùng làm tư liệu: học câu hỏi thật của khách, cách mở đầu, nhịp, lời kêu gọi.
**Không chép nguyên văn**: `npm run kiem-tra` báo lỗi khi bài có đoạn từ 12 chữ liên tiếp giống hệt tư liệu mà bài dẫn nguồn.

## ⚠️ Repo này đang công khai
Transcript là lời của người khác. Chỉ đưa vào đây:
- transcript video của chính VCPV, hoặc
- bản **tóm tắt ý** (không chép lời) của video người khác.

Bản transcript đầy đủ của kênh khác thì để ngoài repo (trên máy, hoặc trong VCwiki), rồi trỏ tới bằng biến môi trường:
`TU_LIEU_DIR=/đường/dẫn/transcript npm run kiem-tra`

## Định dạng: `tu-lieu/transcript/<slug>.md`
Xem `transcript/_mau.md` (file bắt đầu bằng `_` bị bỏ qua).

| Trường | Bắt buộc | Ý nghĩa |
|---|---|---|
| `link` | có | Link video gốc |
| `kenh` | có | Tên kênh, ví dụ `@garaxyz` |
| `tieuDe` | có | Tiêu đề hoặc câu mở đầu của video |
| `ngayLay` | có | Ngày lấy transcript (YYYY-MM-DD) |
| `chuDe` | có | Danh sách chủ đề, trùng tên `nhom` trong `website/content/ke-hoach-seo.json` (Ắc quy, Lốp, …) |
| `loai` | có | `cua-minh` (video VCPV) hoặc `tom-tat` (tóm tắt ý video người khác) |
| `ngayDang`, `luotXem`, `luotThich` | không | Số liệu của video |
| `cauHoiKhach` | không | Câu hỏi khách hỏi trong video hoặc bình luận, dùng làm FAQ |

Thân file: lời nói, mỗi câu một dòng, có mốc thời gian dạng `[00:03]`.

## Bài và kịch bản dẫn nguồn thế nào
- Bài website: thêm `tuLieu: [<slug>]` ở phần đầu bài. Trang quản trị (`/quan-tri/`) hiện tư liệu nào đã dùng, chưa dùng.
- Kịch bản video: ghi slug tư liệu vào `output/<ten>/nguon.txt`.

## Lấy từ TIKTIKTOTEXT
TIKTIKTOTEXT chạy trên máy anh Thọ Anh (`/Users/apple/projects/TIKTIKTOTEXT`, FastAPI + React).
Khi có quyền đọc mã, viết script xuất thẳng ra định dạng trên. Trước đó, xuất tay: mỗi video một file.
