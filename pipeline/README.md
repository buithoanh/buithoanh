# Dây chuyền video TikTok sản phẩm

Đưa ảnh sản phẩm và ý tưởng vào, nhận video dọc 1080×1920 có giọng đọc tiếng Việt.

```
Claude Code + agent "Content Pipeline"   →  viết kịch bản (theo TikTok Strategist), người dùng duyệt
  └─ pipeline/lam_video.py
       1. PhotoCraft CLI  →  đặt ảnh vào khung dọc, chèn tiêu đề   (thiếu thì tự dùng ffmpeg)
       2. VieNeu-TTS      →  đọc kịch bản thành giọng nói
       3. ffmpeg          →  ghép ảnh (zoom nhẹ) + giọng thành video mp4
```

Mọi thành phần đều mã nguồn mở và cho phép dùng thương mại:

| Thành phần | Giấy phép | Vai trò |
|---|---|---|
| [VieNeu-TTS](https://github.com/pnnbao97/VieNeu-TTS) v3 Turbo | Apache-2.0 (mã và mô hình) | Đọc tiếng Việt, 25 giọng có sẵn, nhân bản giọng |
| [PhotoCraft](https://github.com/storytold/photocraft) | MIT hoặc Apache-2.0 | Xử lý ảnh không cần giao diện (bản alpha) |
| [ffmpeg](https://ffmpeg.org) | LGPL/GPL | Ghép video |
| [VoiceStudio](https://github.com/debpalash/VoiceStudio) + VoxCPM2 | App AGPL-3.0, mô hình Apache-2.0 | Studio giọng nói có giao diện cho nhân viên (tuỳ chọn) |

## Cách dùng

Trong Claude Code, ở thư mục repo:

```
Dùng Content Pipeline làm video TikTok cho má phanh Brembo, ảnh ở anh/ma-phanh-1.jpg và anh/ma-phanh-2.jpg, bán cho thợ garage
```

Hoặc chạy thẳng script:

```bash
python3 pipeline/lam_video.py \
  --anh anh/ma-phanh-1.jpg anh/ma-phanh-2.jpg \
  --kich-ban output/ma-phanh/kich-ban.txt \
  --tieu-de "Má phanh còn sống không?" \
  --giong "Hải Đăng" \
  --out output/ma-phanh/video.mp4
```

Tuỳ chọn khác: `--khong-photocraft` (chỉ dùng ffmpeg), `--giong-co-san file.wav` (bỏ qua bước đọc), `--vieneu-url` hoặc biến `VIENEU_URL` (mặc định `http://127.0.0.1:8000`), biến `PHOTOCRAFT_CLI` (đường dẫn tới photocraft-cli nếu không nằm trên PATH).

## Cài đặt (làm một lần trên máy chạy)

### 1. ffmpeg và Python 3.10+
- Windows: `winget install Gyan.FFmpeg`
- macOS: `brew install ffmpeg`
- Ubuntu: `sudo apt install ffmpeg`

### 2. VieNeu-TTS (giọng đọc)

Cách nhanh nhất là Docker. Không có card đồ hoạ vẫn chạy được (khoảng gấp đôi thời gian thực):

```bash
git clone https://github.com/pnnbao97/VieNeu-TTS.git
cd VieNeu-TTS
docker compose -f docker/docker-compose.yml --profile api-cpu up    # có card NVIDIA: --profile api-gpu
```

Hoặc không dùng Docker: cài [uv](https://docs.astral.sh/uv/), rồi `uv sync` (CPU) hoặc `uv sync --extra cuda` (GPU), sau đó `uv run python -m apps.openai_speech`.

Server chạy ở `http://127.0.0.1:8000`. Kiểm tra: `curl http://127.0.0.1:8000/v1/voices`.
Muốn nghe thử giọng trước: `uv run vieneu-web` rồi mở `http://127.0.0.1:7860`.

Nếu mở server cho máy khác trong mạng gọi (`HOST=0.0.0.0`), đặt `VIENEU_API_KEY=<chuỗi ngẫu nhiên dài>` cho server và cùng biến đó ở máy chạy script.

### 3. PhotoCraft CLI (xử lý ảnh, tuỳ chọn)

Cần [Rust](https://rustup.rs) 1.95 trở lên. Trên Ubuntu cần thêm: `sudo apt install libxkbcommon-dev libwayland-dev libx11-dev libxrandr-dev libxi-dev libgl1-mesa-dev libgtk-3-dev`.

```bash
git clone https://github.com/storytold/photocraft.git
cd photocraft
cargo build --release -p photocraft-cli
# chép target/release/photocraft-cli vào một thư mục trên PATH, hoặc đặt PHOTOCRAFT_CLI=<đường dẫn>
```

Không cài PhotoCraft thì script tự dùng ffmpeg để đóng khung ảnh, chỉ không chèn được tiêu đề lên ảnh.

Cho Claude Code điều khiển PhotoCraft trực tiếp (chỉnh ảnh theo yêu cầu, ngoài dây chuyền) qua MCP: file `.mcp.json` ở gốc repo đã khai báo sẵn. Claude Code sẽ hỏi bạn có bật nó không ở lần mở đầu.

### 4. VoiceStudio + VoxCPM2 (studio có giao diện, tuỳ chọn)

Dành cho nhân viên làm giọng bằng tay: lồng tiếng, sách nói, nhân bản giọng.

- Cài theo [README của VoiceStudio](https://github.com/debpalash/VoiceStudio) (bản cài sẵn, hoặc Docker `--profile gpu`).
- **Bắt buộc đổi mô hình:** mô hình mặc định OmniVoice chỉ được dùng phi thương mại. Vào Settings → Engines, bấm **Use** ở VoxCPM2 (hoặc đặt biến `OMNIVOICE_TTS_BACKEND=voxcpm2`). VoxCPM2 cần card NVIDIA.
- Nối VoiceStudio vào Claude Code qua MCP: `claude mcp add --transport http voicestudio http://127.0.0.1:3900/mcp/`
- Nếu mở VoiceStudio cho máy khác dùng, đặt `OMNIVOICE_API_KEY`, vì mặc định nó không bật xác thực.

## Lưu ý pháp lý và an toàn
- Chỉ nhân bản giọng khi chủ giọng đồng ý. Giấy phép Apache-2.0 cho phép dùng phần mềm, không cho phép dùng giọng của người khác.
- VieNeu mặc định đóng dấu ẩn (watermark) vào âm thanh để nhận biết giọng do AI tạo. Nên giữ nguyên.
- Bản VieNeu v4 là bản đóng, chỉ có qua dịch vụ trả phí vieneu.io. Dây chuyền này dùng bản mở v3 Turbo.
- Trước khi dùng thương mại, mở trang mô hình `pnnbao-ump/VieNeu-TTS-v3-Turbo` trên Hugging Face xem lại giấy phép.

## Chưa nằm trong dây chuyền
- **SystemOneHarness:** cần API trả phí và chỉ chọn được giữa các phương án liệt kê sẵn, không viết được kịch bản. Không dùng cho dây chuyền nội dung.
- **vcwiki/tiktok-to-text:** repo GitLab riêng tư, chưa có quyền đọc. Khi có, nó sẽ là bước 0 (lấy lời từ video tham khảo).
