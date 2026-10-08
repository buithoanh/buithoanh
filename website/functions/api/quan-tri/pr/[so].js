// /api/quan-tri/pr/<số>
// GET: nội dung để duyệt (bài viết hoặc kế hoạch), góp ý, kết quả kiểm tra tự động.
// POST { hanhDong: "duyet" | "yeu-cau-sua" | "bo", gopY, sha }: duyệt (merge), gửi góp ý cho AI sửa, hoặc bỏ.
import { github, loaiPR, fileLaHopLe, dangChay, tomTatKiemTra, timLinkXemTruoc, kyTen } from "../../../../lib/quan-tri/github.js";
import { canQuanTri, LoiHttp } from "../../../../lib/quan-tri/xac-thuc.js";

async function layPR(g, so) {
  if (!/^\d+$/.test(so)) throw new LoiHttp(400, "Số pull request không hợp lệ");
  const pr = await g.gh(`/pulls/${so}`);
  const loai = loaiPR(pr);
  if (!loai || pr.base.ref !== g.base) throw new LoiHttp(404, "Không phải kế hoạch hay bài viết");
  return { pr, loai };
}

const thangCua = (b) => b.thang;
const boThang = (plan, thang) => JSON.stringify({ ...plan, baiKeHoach: (plan.baiKeHoach || []).filter((b) => thangCua(b) !== thang) });

async function soSanhKeHoach(g, pr) {
  const thang = pr.head.ref.slice("ke-hoach/".length);
  const cmp = await g.gh(`/compare/${pr.base.sha}...${pr.head.sha}`);
  const [goc, moi] = await Promise.all([g.keHoach(cmp.merge_base_commit.sha), g.keHoach(pr.head.sha)]);
  const gocTheoSlug = new Map((goc.baiKeHoach || []).filter((b) => thangCua(b) === thang).map((b) => [b.slug, b]));
  const muc = (moi.baiKeHoach || [])
    .filter((b) => thangCua(b) === thang)
    .map((b) => ({ ...b, thayDoi: !gocTheoSlug.has(b.slug) ? "moi" : JSON.stringify(gocTheoSlug.get(b.slug)) !== JSON.stringify(b) ? "sua" : "giu" }));
  const conSlug = new Set(muc.map((b) => b.slug));
  const daBo = [...gocTheoSlug.values()].filter((b) => !conSlug.has(b.slug));
  const lich = (moi.lichDang || []).find((l) => l.thang === thang) || null;
  // Kế hoạch tháng này không được sửa tháng khác hay quy tắc chung.
  const suaNgoaiThang = boThang(goc, thang) !== boThang(moi, thang);
  return { thang, muc, daBo, lich, suaNgoaiThang };
}

export async function onRequestGet({ env, params }) {
  const g = github(env);
  const { pr, loai } = await layPR(g, params.so);
  const [files, comments, checks, runs] = await Promise.all([
    g.gh(`/pulls/${pr.number}/files?per_page=100`),
    g.gh(`/issues/${pr.number}/comments?per_page=100`),
    g.gh(`/commits/${pr.head.sha}/check-runs?per_page=100`),
    g.runs(),
  ]);
  const kiemTra = tomTatKiemTra(checks.check_runs);

  const res = {
    so: pr.number,
    loai,
    tieuDe: pr.title,
    moTa: pr.body || "",
    nhanh: pr.head.ref,
    sha: pr.head.sha,
    url: pr.html_url,
    trangThai: pr.state,
    xungDot: pr.mergeable === false,
    capNhat: pr.updated_at,
    dangChay: dangChay(runs, `#${pr.number}`),
    fileSai: fileLaHopLe(loai, files),
    kiemTra,
    xemTruoc: timLinkXemTruoc([...checks.check_runs.map((c) => c.output?.summary), ...comments.map((c) => c.body)]),
    gopY: comments.map((c) => ({ nguoi: c.user?.login, luc: c.created_at, noiDung: c.body })),
  };

  if (loai === "bai") {
    const md = files.find((f) => /^website\/content\/cam-nang\/[a-z0-9-]+\.md$/.test(f.filename));
    res.bai = md ? { file: md.filename, noiDung: await g.fileAt(md.filename, pr.head.sha) } : null;
  } else {
    res.keHoach = await soSanhKeHoach(g, pr);
  }
  return Response.json(res, { headers: { "cache-control": "no-store" } });
}

export async function onRequestPost({ request, env, params, data }) {
  const g = github(env);
  const user = data.user;
  const { pr, loai } = await layPR(g, params.so);
  if (loai === "ke-hoach") canQuanTri(user);
  if (pr.state !== "open") throw new LoiHttp(409, "Pull request đã đóng");
  const body = await request.json().catch(() => ({}));
  const gopY = String(body.gopY || "").trim().slice(0, 8000);
  const ten = loai === "bai" ? "bài" : "kế hoạch";

  if (body.hanhDong === "duyet") {
    // Duyệt đúng phiên bản người duyệt đã đọc: AI đẩy bản mới sau đó thì phải đọc lại.
    if (body.sha !== pr.head.sha) throw new LoiHttp(409, `AI vừa cập nhật ${ten} này, tải lại để đọc bản mới trước khi duyệt`);
    const files = await g.gh(`/pulls/${pr.number}/files?per_page=100`);
    const sai = fileLaHopLe(loai, files);
    if (sai.length) throw new LoiHttp(409, `Pull request đổi file ngoài phạm vi ${ten}, cần duyệt trên GitHub: ${sai.join(", ")}`);
    if (loai === "ke-hoach" && (await soSanhKeHoach(g, pr)).suaNgoaiThang) {
      throw new LoiHttp(409, "Kế hoạch này sửa cả tháng khác hoặc phần chung của kế hoạch, cần duyệt trên GitHub");
    }
    const { tongHop } = tomTatKiemTra((await g.gh(`/commits/${pr.head.sha}/check-runs?per_page=100`)).check_runs);
    if (tongHop === "loi") throw new LoiHttp(409, "Kiểm tra tự động báo lỗi, chưa duyệt được");
    if (tongHop === "dang-chay") throw new LoiHttp(409, "Kiểm tra tự động đang chạy, đợi một chút rồi duyệt");
    if (pr.mergeable === false) throw new LoiHttp(409, `${ten[0].toUpperCase() + ten.slice(1)} xung đột với bản chính, bấm "Yêu cầu sửa" để AI cập nhật`);

    await g.comment(pr.number, `✅ Đã duyệt ${ten}.${gopY ? `\n\n${gopY}` : ""}${kyTen(user)}`);
    await g.gh(`/pulls/${pr.number}/merge`, {
      method: "PUT",
      body: { merge_method: "squash", sha: pr.head.sha, commit_title: `${pr.title} (#${pr.number})`, commit_message: `Duyệt bởi ${user.email} trên trang quản trị.` },
    });
    await g.gh(`/git/refs/heads/${pr.head.ref}`, { method: "DELETE" }).catch(() => {});
    return Response.json({ ok: true });
  }

  if (body.hanhDong === "yeu-cau-sua") {
    if (!gopY) throw new LoiHttp(400, "Ghi góp ý để AI biết cần sửa gì");
    await g.comment(pr.number, `✏️ Yêu cầu sửa:\n\n${gopY}${kyTen(user)}`);
    await g.chay({ viec: loai === "bai" ? "sua-bai" : "sua-ke-hoach", pr: String(pr.number), gop_y: gopY, nguoi: user.email });
    return Response.json({ ok: true });
  }

  if (body.hanhDong === "bo") {
    await g.comment(pr.number, `🗑️ Bỏ ${ten} này.${gopY ? `\n\n${gopY}` : ""}${kyTen(user)}`);
    await g.gh(`/pulls/${pr.number}`, { method: "PATCH", body: { state: "closed" } });
    // Xoá nhánh để sau này có thể cho AI viết / lập lại.
    await g.gh(`/git/refs/heads/${pr.head.ref}`, { method: "DELETE" }).catch(() => {});
    return Response.json({ ok: true });
  }

  throw new LoiHttp(400, "Hành động không hợp lệ");
}

