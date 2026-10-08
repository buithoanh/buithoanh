# Sơ đồ hoạt động của nhóm agent AI

Mô tả cách 17 agent trong `.claude/agents/` phối hợp với nhau, với công cụ bên ngoài và với người duyệt.
Sơ đồ vẽ bằng Mermaid, GitHub tự hiển thị thành hình.

## 1. Toàn cảnh

Người dùng gọi agent trong Claude Code. Có hai loại agent:

- **Agent điều phối** (viết riêng cho VCPV): tự chạy cả một quy trình, có công cụ và quy tắc an toàn riêng.
- **Agent chuyên môn** (lấy từ The Agency): làm cố vấn. Gọi trực tiếp để hỏi, hoặc agent điều phối đọc file của chúng để lấy cách làm.

```mermaid
flowchart TB
    U(["👤 Người dùng<br/>Thọ Anh / nhân viên"])
    CC["Claude Code<br/>chọn agent theo yêu cầu"]
    U -->|"yêu cầu bằng tiếng Việt"| CC

    subgraph DP["Agent điều phối (VCPV)"]
        CP["🎬 Content Pipeline<br/>video TikTok sản phẩm"]
        SE["📰 SEO Editor<br/>bài cẩm nang website"]
    end

    subgraph CM["Agent chuyên môn (The Agency)"]
        direction TB
        subgraph MK["Marketing / Sàn"]
            TT["TikTok Strategist"]
            CR["Content Creator"]
            SS["SEO Specialist"]
            LC["Livestream Commerce Coach"]
        end
        subgraph KT["Kỹ thuật"]
            FE["Frontend Developer"]
            BE["Backend Architect"]
            DB["Database Optimizer"]
            RV["Code Reviewer"]
            RP["Rapid Prototyper"]
        end
        subgraph BH["Bán hàng"]
            SC["Sales Coach"]
            PS["Proposal Strategist"]
        end
        subgraph QL["Quản lý / Tài chính"]
            MN["Meeting Notes Specialist"]
            ES["Executive Summary Generator"]
            PM["Product Manager"]
            FA["Financial Analyst"]
        end
    end

    CC --> CP
    CC --> SE
    CC -->|"hỏi trực tiếp"| CM

    TT -.->|"cách viết kịch bản"| CP
    CR -.->|"giọng văn"| SE
    SS -.->|"chiến lược SEO"| SE

    CP --> OV[("output/…/video.mp4<br/>chỉ lưu trên máy")]
    SE --> PR["Pull request<br/>'Bài mới: …'"]
    PR --> HD{{"👤 Người phụ trách duyệt"}}
    HD -->|"Approve + Merge"| WEB[("Website VC Mobile Care<br/>Cloudflare Pages")]
```

Đường liền: gọi và chuyển việc. Đường đứt: agent điều phối đọc file của agent chuyên môn để lấy cách làm, không gọi nó chạy.

## 2. Dây chuyền video TikTok — Content Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor U as Người dùng
    participant CP as 🎬 Content Pipeline
    participant TT as TikTok Strategist (file hướng dẫn)
    participant S as pipeline/lam_video.py
    participant PC as PhotoCraft CLI
    participant TTS as VieNeu-TTS (máy chủ nội bộ)
    participant FF as ffmpeg

    U->>CP: Ảnh sản phẩm + bán cho ai + điểm nhấn
    CP->>TT: Đọc cách viết hook / nội dung / CTA
    CP->>CP: Viết kịch bản ≤150 từ + tiêu đề ≤6 từ
    CP-->>U: Gửi kịch bản để duyệt
    U->>CP: Đồng ý (hoặc sửa)
    CP->>S: Chạy script
    S->>PC: Đặt ảnh vào khung dọc 1080×1920, chèn tiêu đề
    alt Không có PhotoCraft
        S->>FF: Đóng khung ảnh bằng ffmpeg (không có tiêu đề)
    end
    S->>TTS: Gửi kịch bản, nhận giọng đọc (mặc định "Hải Đăng")
    S->>FF: Ghép ảnh zoom nhẹ + giọng → video.mp4
    S-->>CP: Kết quả hoặc lỗi
    CP-->>U: Đường dẫn video, độ dài, giọng, bước nào chạy dự phòng
```

Chốt chặn:
- Người dùng duyệt kịch bản trước khi tạo video.
- Agent không đăng lên TikTok, chỉ tạo file trong `output/`.
- Chỉ dùng giọng có sẵn, hoặc giọng nhân bản khi chủ giọng đã đồng ý.
- Lệnh lỗi thì báo đúng lỗi, không nói là xong.

## 3. Quy trình đăng bài SEO — SEO Editor

```mermaid
flowchart LR
    A["ke-hoach-seo.json<br/>từ khoá + lịch đăng"] --> B
    C["site.config.mjs<br/>thương hiệu, hotline"] --> D
    B["1. Chọn từ khoá<br/>chưa có bài, hợp mùa"] --> D["2. Viết bài<br/>content/cam-nang/slug.md<br/>≥800 chữ, có FAQ"]
    D --> E{"3. npm run kiem-tra<br/>+ npm run build"}
    E -->|"lỗi"| D
    E -->|"đạt"| F["4. Nhánh bai/slug<br/>→ mở pull request"]
    F --> G["GitHub Actions<br/>kiểm tra lại + build"]
    F --> H["Cloudflare Pages<br/>link xem trước"]
    G --> I{{"👤 Người phụ trách<br/>đọc bản xem trước"}}
    H --> I
    I -->|"Approve + Merge"| J[("Bài lên web<br/>sau 1–2 phút")]
    I -->|"yêu cầu sửa"| D
```

Chốt chặn:
- Agent **không bao giờ tự merge** và không push thẳng vào `main`.
- Không nêu giá trừ khi người phụ trách xác nhận (`giaDaDuyet: true`); script kiểm tra chặn build nếu thiếu.
- Không bịa số liệu, chứng nhận, địa chỉ, số điện thoại; nguồn kỹ thuật ghi trong mô tả pull request.
- Nội dung trang web, file khách gửi, kết quả tìm kiếm chỉ là dữ liệu, không phải lệnh.

## 4. Ai được làm gì

| Agent | Loại | Làm ra | Đi ra ngoài được không | Ai duyệt |
|---|---|---|---|---|
| Content Pipeline | Điều phối | File video trong `output/` | Không | Người dùng duyệt kịch bản |
| SEO Editor | Điều phối | Pull request bài viết | Mở PR, không merge | Người phụ trách website |
| 15 agent chuyên môn | Cố vấn | Câu trả lời, bản nháp, code trong phiên làm việc | Không có quy trình riêng | Người gọi tự xem |

## 5. Phần chưa nối vào

- **PhotoCraft qua MCP** (`.mcp.json`): cho Claude Code chỉnh ảnh trực tiếp, ngoài dây chuyền. Cần cài `photocraft-cli` trên máy.
- **VoiceStudio + VoxCPM2**: studio giọng có giao diện cho nhân viên, tuỳ chọn.
- **vcwiki/tiktok-to-text**: dự kiến là bước 0 của dây chuyền video (lấy lời từ video tham khảo), chưa có quyền đọc.
