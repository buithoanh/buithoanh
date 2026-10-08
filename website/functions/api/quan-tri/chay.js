// POST /api/quan-tri/chay: quản trị ra lệnh cho AI — lập kế hoạch tháng mới, hoặc viết các bài trong kế hoạch đã duyệt.
import { github } from "../../../lib/quan-tri/github.js";
import { canQuanTri, LoiHttp } from "../../../lib/quan-tri/xac-thuc.js";

export async function onRequestPost({ request, env, data }) {
  canQuanTri(data.user);
  const body = await request.json().catch(() => ({}));
  const g = github(env);
  const gopY = String(body.gopY || "").slice(0, 8000);

  if (body.viec === "lap-ke-hoach") {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(body.thang || "")) throw new LoiHttp(400, "Tháng phải dạng YYYY-MM");
    await g.chay({ viec: "lap-ke-hoach", thang: body.thang, gop_y: gopY, nguoi: data.user.email });
    return Response.json({ ok: true, soLuot: 1 });
  }

  if (body.viec === "viet-bai") {
    const slugs = [...new Set(Array.isArray(body.slugs) ? body.slugs : [])];
    if (!slugs.length || slugs.length > 20) throw new LoiHttp(400, "Chọn từ 1 đến 20 bài");
    const plan = await g.keHoach();
    const coTrongKeHoach = new Set((plan.baiKeHoach || []).map((b) => b.slug));
    const sai = slugs.filter((s) => typeof s !== "string" || !coTrongKeHoach.has(s));
    if (sai.length) throw new LoiHttp(400, `Không có trong kế hoạch đã duyệt: ${sai.join(", ")}`);
    for (const slug of slugs) await g.chay({ viec: "viet-bai", slug, gop_y: gopY, nguoi: data.user.email });
    return Response.json({ ok: true, soLuot: slugs.length });
  }

  throw new LoiHttp(400, "Việc không hợp lệ");
}
