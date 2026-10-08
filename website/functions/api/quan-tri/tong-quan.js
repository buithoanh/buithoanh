// GET /api/quan-tri/tong-quan: kế hoạch đã duyệt (trên main) kèm trạng thái từng bài, PR chờ duyệt, các lượt AI gần đây.
import { github, loaiPR, dangChay } from "../../../lib/quan-tri/github.js";

export async function onRequestGet({ env, data }) {
  const g = github(env);
  const [plan, pulls, runs, camNang] = await Promise.all([
    g.keHoach(),
    g.openPulls(),
    g.runs(),
    g.gh(`/contents/website/content/cam-nang?ref=${encodeURIComponent(g.base)}`).catch(() => []),
  ]);
  const daDang = new Set(camNang.map((f) => f.name.replace(/\.md$/, "")));
  const pr = (p) => ({ so: p.number, tieuDe: p.title, nhanh: p.head.ref, capNhat: p.updated_at, dangChay: dangChay(runs, `#${p.number}`) });
  const keHoachPR = pulls.filter((p) => loaiPR(p) === "ke-hoach").map((p) => ({ ...pr(p), thang: p.head.ref.slice(9) }));
  const baiPR = pulls.filter((p) => loaiPR(p) === "bai").map((p) => ({ ...pr(p), slug: p.head.ref.slice(4) }));
  const prTheoSlug = new Map(baiPR.map((p) => [p.slug, p.so]));

  const baiKeHoach = (plan.baiKeHoach || []).map((b) => ({
    ...b,
    trangThai: daDang.has(b.slug) ? "da-dang" : prTheoSlug.has(b.slug) ? "cho-duyet" : dangChay(runs, b.slug) ? "dang-viet" : "chua-viet",
    pr: prTheoSlug.get(b.slug) || null,
  }));

  return Response.json(
    {
      toi: data.user,
      repo: g.repo,
      lichDang: plan.lichDang || [],
      baiKeHoach,
      keHoachPR,
      baiPR,
      runs: runs.slice(0, 12),
      thangDangLap: [...new Set(runs.filter((r) => r.trangThai !== "completed" && r.ten.startsWith("lap-ke-hoach ")).map((r) => r.ten.split(" ")[1]))],
    },
    { headers: { "cache-control": "no-store" } },
  );
}
