// Gọi GitHub API cho trang quản trị. Token nằm trong biến môi trường Cloudflare, không bao giờ gửi xuống trình duyệt.
// Kế hoạch là pull request nhánh ke-hoach/<thang>, bài là pull request nhánh bai/<slug>.
import { LoiHttp } from "./xac-thuc.js";

export const WORKFLOW = "ai-agent.yml";
export const KE_HOACH_FILE = "website/content/ke-hoach-seo.json";
// Những file mỗi loại pull request được phép đổi; PR đụng tới file khác không duyệt được từ trang quản trị.
const FILE_CHO_PHEP = {
  "ke-hoach": [/^website\/content\/ke-hoach-seo\.json$/],
  bai: [/^website\/content\/cam-nang\/[a-z0-9-]+\.md$/, /^website\/public\/anh\/[a-z0-9-]+\/[\w.-]+\.(jpe?g|png|webp)$/],
};

export function github(env) {
  const repo = env.GITHUB_REPO;
  if (!repo || !env.GITHUB_TOKEN) throw new LoiHttp(500, "Chưa cấu hình GITHUB_REPO / GITHUB_TOKEN");
  const base = env.GITHUB_BASE || "main";

  async function gh(path, { method = "GET", body, raw } = {}) {
    const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${env.GITHUB_TOKEN}`,
        accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "vc-mobile-care-quan-tri",
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      let msg = text;
      try {
        msg = JSON.parse(text).message || text;
      } catch {}
      throw new LoiHttp(res.status === 404 ? 404 : res.status === 409 || res.status === 405 ? 409 : 502, `GitHub: ${msg}`);
    }
    const text = await res.text();
    if (raw) return text;
    return text ? JSON.parse(text) : null;
  }

  const fileAt = async (path, ref) => {
    try {
      return await gh(`/contents/${path}?ref=${encodeURIComponent(ref)}`, { raw: true });
    } catch (e) {
      if (e.status === 404) return null;
      throw e;
    }
  };

  return {
    repo,
    base,
    gh,
    fileAt,
    async keHoach(ref = base) {
      const text = await fileAt(KE_HOACH_FILE, ref);
      return text ? JSON.parse(text) : { baiKeHoach: [], lichDang: [], nhomTuKhoa: [] };
    },
    async openPulls() {
      return gh(`/pulls?state=open&per_page=100&base=${encodeURIComponent(base)}`);
    },
    async runs() {
      const r = await gh(`/actions/workflows/${WORKFLOW}/runs?per_page=20`);
      return (r?.workflow_runs || []).map((x) => ({
        ten: x.display_title,
        trangThai: x.status,
        ketQua: x.conclusion,
        luc: x.created_at,
        url: x.html_url,
      }));
    },
    async chay(inputs) {
      const clean = Object.fromEntries(Object.entries(inputs).filter(([, v]) => v !== undefined && v !== ""));
      await gh(`/actions/workflows/${WORKFLOW}/dispatches`, { method: "POST", body: { ref: base, inputs: clean } });
    },
    comment(so, body) {
      return gh(`/issues/${so}/comments`, { method: "POST", body: { body } });
    },
  };
}

export function loaiPR(pr) {
  const ref = pr?.head?.ref || "";
  if (pr?.head?.repo?.full_name !== pr?.base?.repo?.full_name) return null;
  if (ref.startsWith("ke-hoach/")) return "ke-hoach";
  if (ref.startsWith("bai/")) return "bai";
  return null;
}

export function fileLaHopLe(loai, files) {
  const allow = FILE_CHO_PHEP[loai] || [];
  const sai = files.filter((f) => !allow.some((re) => re.test(f.filename)) || f.status === "removed");
  return sai.map((f) => f.filename);
}

// Lượt AI đang chạy cho một PR / slug / tháng (khớp theo run-name của workflow).
export function dangChay(runs, khoa) {
  return runs.some((r) => r.trangThai !== "completed" && ` ${r.ten} `.includes(` ${khoa} `));
}

export function tomTatKiemTra(checkRuns) {
  const list = (checkRuns || []).map((c) => ({ ten: c.name, trangThai: c.status, ketQua: c.conclusion, url: c.html_url }));
  const loi = list.some((c) => c.trangThai === "completed" && !["success", "neutral", "skipped"].includes(c.ketQua));
  const dang = list.some((c) => c.trangThai !== "completed");
  return { list, tongHop: loi ? "loi" : dang ? "dang-chay" : list.length ? "dat" : "khong-co" };
}

export function timLinkXemTruoc(texts) {
  for (const t of texts) {
    const m = String(t || "").match(/https:\/\/[a-z0-9.-]+\.pages\.dev[^\s)"'<>|]*/i);
    if (m) return m[0];
  }
  return null;
}

export const kyTen = (user) => `\n\n— ${user.email}, qua trang quản trị`;
