# Nguồn tri thức

## VCWIKI (tên cũ TIKTOKTOTEXT, gồm module VCmedia)

Dự án lấy chữ (text) từ video các kênh TikTok, làm nguồn dữ liệu thô cho VCwiki.
Source code **không nằm trong repo này**:

- Thư mục trên máy anh Thọ Anh: `/Users/apple/projects/TIKTIKTOTEXT`
- Repo GitLab: https://gitlab.com/vcwiki/tiktok-to-text.git (remote `origin`, repo private)
- Nhánh tích hợp: `develop`. Nhánh chính: `main` — không merge vào main, không deploy.

Cấu trúc:
- `backend/` — FastAPI (`uvicorn app.main:app`), Python trong `.venv/`
- `frontend/` — React + Vite
- `docs/` — `BA.md`, `DESIGN.md`, `UAT.md` và tài liệu nghiệp vụ
- `CLAUDE.md` — quy ước làm việc, đọc trước khi làm

Chạy app:
- `bash start_web.sh --dev` → BE http://localhost:8000 + FE http://localhost:5173 (DB dev `tiktok_to_text_dev`)
- `bash start_web.sh` → bản thường :8000 (DB thật, cẩn thận khi ghi dữ liệu)

Quy tắc khi làm việc trong dự án đó:
1. Làm việc trong thư mục dự án (cd vào hoặc mở phiên Claude Code tại đó).
2. Đầu phiên chạy `bash ra_nhanh.sh --ngan`; có nhánh bị bỏ quên thì báo lại.
3. Theo quy trình BA → DESIGN → Code → UAT trong `CLAUDE.md` của dự án.
   Commit viết tiếng Việt, ghi kèm mã BA + mã DESIGN.
4. Nhắc tới file thì ghi dạng `đường/dẫn/file:số_dòng`, tính từ gốc repo.

Lưu ý cho phiên cloud: container cloud không thấy ổ máy Mac và không clone được
repo GitLab private khi chưa có token. Muốn đọc dữ liệu thô thì mở phiên Claude Code
ngay trên máy, hoặc đưa token GitLab / bản xuất dữ liệu vào môi trường.
