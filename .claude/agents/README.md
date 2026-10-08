# Agent chuyên môn (The Agency)

Lấy từ [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) (commit `f99f6aa`, giấy phép MIT – xem `LICENSE-agency-agents`).
Repo gốc có 282 agent; ở đây chỉ chọn 15 agent hợp với công việc VCPV.

## Cách dùng

Mở Claude Code trong repo này, gọi agent theo tên, ví dụ:

- `Dùng TikTok Strategist lên kế hoạch 2 tuần video cho đèn pha ô tô`
- `Nhờ Meeting Notes Specialist tóm tắt biên bản họp tuần này: <dán ghi chú>`
- `Dùng Code Reviewer review thay đổi hiện tại`

Gõ `/agents` để xem danh sách.

| Nhóm | Agent | Dùng khi |
|---|---|---|
| Kỹ thuật | Frontend Developer, Backend Architect, Database Optimizer | Xây app Next.js/Prisma, API, tối ưu DB |
| Kỹ thuật | Code Reviewer, Rapid Prototyper | Review code, làm MVP nhanh |
| Sàn / Marketing | TikTok Strategist, Livestream Commerce Coach | TikTok Shop, livestream bán phụ tùng |
| Marketing | Content Creator, SEO Specialist | Bài viết, SEO website |
| Bán hàng | Sales Coach, Proposal Strategist | Huấn luyện sale, viết đề xuất / báo giá |
| Quản lý | Meeting Notes Specialist, Executive Summary Generator, Product Manager | Biên bản họp, báo cáo tóm tắt cho HĐQT, định hướng sản phẩm |
| Tài chính | Financial Analyst | Phân tích tài chính, mô hình dự báo |
| Web VC Mobile Care (tự viết) | Research Gatherer → SEO Editor | Gom tư liệu từ kho transcript VCWIKI (MCP `vc-content`, chạy trên máy có kho), rồi viết bài và mở PR duyệt |

## Thêm agent khác

```bash
git clone --depth 1 https://github.com/msitarzewski/agency-agents.git /tmp/agency-agents
/tmp/agency-agents/scripts/install.sh --list agents
/tmp/agency-agents/scripts/install.sh --tool claude-code --path .claude/agents --agent <slug1>,<slug2> --no-interactive
```

Bỏ `--path .claude/agents` để cài vào `~/.claude/agents` (dùng cho mọi project trên máy).
