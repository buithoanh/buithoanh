// Quy tắc kiểm tra bài, dùng chung cho script build (scripts/kiem-tra-bai.mjs) và trang quản trị (scripts/quan-tri.mjs).
// Mỗi bài trả về danh sách mục kiểm tra { label, ok, level: "error" | "warn", detail }.
import site from "../site.config.mjs";
import { slugsOf, readEntry } from "./content.mjs";
import { tuLieuSlugs, readTuLieu, doanTrung } from "./tu-lieu.mjs";

export const RULES = {
  "dich-vu": { required: ["title", "description", "keyword", "ten", "tomTat"], minWords: 350 },
  "cam-nang": { required: ["title", "description", "keyword", "nhom", "ngay"], minWords: 600 },
};

export const norm = (s) => String(s || "").toLowerCase().normalize("NFC");
const PRICE = /\d[\d.,]*\s*(đ|đồng|vnđ|vnd|k|nghìn|ngàn|triệu)(?!\p{L})/iu;

export function checkEntry(e) {
  const services = slugsOf("dich-vu");
  const tuLieuCo = tuLieuSlugs();
  const { required, minWords } = RULES[e.section];
  const t = String(e.data.title || "");
  const d = String(e.data.description || "");
  const kw = norm(e.data.keyword);
  const head = norm(t + " " + e.body.split(/\s+/).slice(0, 120).join(" "));
  const missing = required.filter((k) => !e.data[k]);
  const badLinks = [...e.body.matchAll(/\]\((\/[^)\s]*)\)/g)]
    .map(([, href]) => href)
    .filter((href) => {
      const m = href.match(/^\/(dich-vu|cam-nang)\/([^/]+)\/?$/);
      return m && !slugsOf(m[1]).includes(m[2]);
    });
  const badServices = (e.data.dichVuLienQuan || []).filter((s) => !services.includes(s));
  const tuLieu = e.data.tuLieu || [];
  const tuLieuThieu = tuLieu.filter((s) => !tuLieuCo.includes(s));
  const trung = tuLieu.filter((s) => tuLieuCo.includes(s))
    .map((s) => ({ s, doan: doanTrung(e.body, readTuLieu(s).body) }))
    .filter((x) => x.doan);

  const c = (label, ok, detail, level = "error") => ({ label, ok, detail: ok ? "" : detail, level });
  const checks = [
    c("Tên file chữ thường không dấu", /^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.slug),
      "tên file phải là chữ thường không dấu, nối bằng gạch ngang (ví dụ thay-ac-quy-o-to.md)"),
    c("Đủ trường ở phần đầu bài", !missing.length, missing.map((k) => `thiếu trường "${k}" ở phần đầu bài`).join("; ")),
    c("Tiêu đề 25–70 ký tự", !t || (t.length >= 25 && t.length <= 70), `tiêu đề dài ${t.length} ký tự, cần 25–70`),
    c("Mô tả 100–170 ký tự", !d || (d.length >= 100 && d.length <= 170), `mô tả dài ${d.length} ký tự, cần 100–170`),
    c(`Tối thiểu ${minWords} chữ`, e.words >= minWords, `bài có ${e.words} chữ, cần tối thiểu ${minWords}`),
    c("Từ khoá ở tiêu đề hoặc mở bài", !kw || head.includes(kw),
      `từ khoá chính "${e.data.keyword}" phải có trong tiêu đề hoặc đoạn mở đầu`),
    c("Không có tiêu đề cấp 1 trong thân bài", !/^#\s/m.test(e.body),
      "không dùng tiêu đề cấp 1 (# ) trong thân bài; tiêu đề trang lấy từ trường title"),
    c("Không còn TODO / lorem ipsum", !/\b(TODO|lorem ipsum)\b/i.test(e.body), "còn chữ TODO hoặc lorem ipsum"),
    c("Dịch vụ liên quan tồn tại", !badServices.length,
      badServices.map((s) => `dichVuLienQuan "${s}" không có trong content/dich-vu`).join("; ")),
    c("Liên kết nội bộ không hỏng", !badLinks.length, badLinks.map((h) => `liên kết nội bộ hỏng: ${h}`).join("; ")),
    c("Giá tiền đã được duyệt", !PRICE.test(e.body) || !!e.data.giaDaDuyet,
      "bài có nêu giá tiền: cần người phụ trách xác nhận rồi thêm giaDaDuyet: true ở phần đầu bài"),
    c("Không chép nguyên văn tư liệu", !trung.length,
      trung.map((x) => `chép nguyên văn từ tư liệu "${x.s}": "${x.doan}…", cần viết lại bằng lời của mình`).join("; ")),
  ];
  checks.push(c("Tiêu đề không tự ghi tên thương hiệu", !norm(t).includes(norm(site.name)),
    `tiêu đề đã có "${site.name}", website tự thêm " | ${site.name}" nên tên sẽ hiện hai lần trên Google`, "warn"));
  if (e.section === "cam-nang") {
    checks.push(c("Có liên kết tới trang dịch vụ", /\]\(\/dich-vu\//.test(e.body), "nên có ít nhất 1 liên kết tới trang dịch vụ", "warn"));
  }
  if (tuLieu.length) {
    checks.push(c("Tư liệu dẫn nguồn có trong repo", !tuLieuThieu.length,
      tuLieuThieu.map((s) => `tuLieu "${s}" không có trong tu-lieu/transcript (bản xuất riêng tư thì bỏ qua)`).join("; "), "warn"));
  }
  return checks;
}

/** Kiểm tra toàn bộ content/. Trả về { entries: [{ entry, checks }], duplicates: [[file, ...]] }. */
export function checkAll() {
  const entries = [];
  const seen = new Map();
  for (const section of Object.keys(RULES)) {
    for (const slug of slugsOf(section)) {
      const entry = readEntry(section, slug);
      const key = norm(entry.data.title);
      if (key) seen.set(key, [...(seen.get(key) || []), `content/${section}/${slug}.md`]);
      entries.push({ entry, checks: checkEntry(entry) });
    }
  }
  const duplicates = [...seen.values()].filter((f) => f.length > 1);
  return { entries, duplicates };
}
