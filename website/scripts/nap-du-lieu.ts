// Nạp dữ liệu ban đầu vào CMS: 6 trang dịch vụ, các bài cẩm nang, bộ từ khoá và kế hoạch SEO
// từ thư mục du-lieu-mau/. Chạy lại nhiều lần không tạo trùng (bỏ qua bài đã có cùng đường dẫn).
//   npm run nap-du-lieu
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getPayload } from "payload";
import config from "../payload.config";
import { markdownSangNoiDung } from "../lib/soan-thao";

const GOC = path.resolve(process.cwd(), "du-lieu-mau");
const payload = await getPayload({ config });
const choPhepDang = { choPhepDang: true };

async function docMarkdown(thuMuc: string) {
  const dir = path.join(GOC, thuMuc);
  const tep = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  return Promise.all(tep.map(async (f) => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
    return { slug: f.replace(/\.md$/, ""), data, noiDung: await markdownSangNoiDung(payload, content) };
  }));
}

const daCo = async (collection: "dich-vu" | "cam-nang", slug: string) =>
  (await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })).docs[0];

// Bài tạo thành nháp trước, đăng sau khi đã nạp đủ (các bài dẫn link qua lại lẫn nhau).
const choDang: { collection: "dich-vu" | "cam-nang"; id: number | string }[] = [];

// 1. Trang dịch vụ
const idDichVu = new Map<string, number | string>();
for (const b of await docMarkdown("dich-vu")) {
  const cu = await daCo("dich-vu", b.slug);
  if (cu) { idDichVu.set(b.slug, cu.id); continue; }
  const doc = await payload.create({
    collection: "dich-vu",
    context: choPhepDang,
    draft: true,
    data: {
      _status: "draft", slug: b.slug, ten: b.data.ten, tomTat: b.data.tomTat, title: b.data.title,
      description: b.data.description, keyword: b.data.keyword, thuTu: b.data.thuTu ?? 99, faq: b.data.faq || [],
      giaDaDuyet: Boolean(b.data.giaDaDuyet), noiDung: b.noiDung as never, trangThaiDuyet: "daDuyet",
    },
  });
  idDichVu.set(b.slug, doc.id);
  choDang.push({ collection: "dich-vu", id: doc.id });
  console.log(`+ dịch vụ: ${b.slug}`);
}

// 2. Bài cẩm nang
const baiTheoTuKhoa = new Map<string, number | string>();
for (const b of await docMarkdown("cam-nang")) {
  const cu = await daCo("cam-nang", b.slug);
  if (cu) { baiTheoTuKhoa.set(String(cu.keyword).toLowerCase(), cu.id); continue; }
  const doc = await payload.create({
    collection: "cam-nang",
    context: choPhepDang,
    draft: true,
    data: {
      _status: "draft", slug: b.slug, title: b.data.title, description: b.data.description, keyword: b.data.keyword,
      nhom: b.data.nhom, ngay: new Date(b.data.ngay).toISOString(), faq: b.data.faq || [],
      ...(b.data.capNhat && { capNhat: new Date(b.data.capNhat).toISOString() }),
      giaDaDuyet: Boolean(b.data.giaDaDuyet), noiDung: b.noiDung as never,
      dichVuLienQuan: (b.data.dichVuLienQuan || []).map((s: string) => idDichVu.get(s)).filter(Boolean) as never,
      trangThaiDuyet: "daDuyet",
    },
  });
  baiTheoTuKhoa.set(String(b.data.keyword).toLowerCase(), doc.id);
  choDang.push({ collection: "cam-nang", id: doc.id });
  console.log(`+ cẩm nang: ${b.slug}`);
}

for (const { collection, id } of choDang) {
  await payload.update({ collection, id, context: choPhepDang, data: { _status: "published" } });
}
console.log(`Đã đăng ${choDang.length} bài.`);

// 3. Từ khoá + kế hoạch
const keHoach = JSON.parse(fs.readFileSync(path.join(GOC, "ke-hoach-seo.json"), "utf8"));
for (const nhom of keHoach.nhomTuKhoa) {
  for (const tuKhoa of nhom.tuKhoa as string[]) {
    const cu = await payload.find({ collection: "tu-khoa", where: { tuKhoa: { equals: tuKhoa } }, limit: 1 });
    if (cu.docs.length) continue;
    const bai = baiTheoTuKhoa.get(tuKhoa.toLowerCase());
    await payload.create({
      collection: "tu-khoa",
      data: {
        tuKhoa, nhom: nhom.nhom, yDinh: nhom.yDinh, luotTimThang: nhom.luotTimThang,
        dichVu: nhom.dichVu ? (idDichVu.get(nhom.dichVu) as never) : undefined,
        trangThai: bai ? "daCoBai" : nhom.nhom === "Bản đồ" ? "boQua" : "chuaViet",
        baiViet: bai as never,
        ghiChu: nhom.ghiChu,
      },
    });
    console.log(`+ từ khoá: ${tuKhoa}`);
  }
}
await payload.updateGlobal({
  slug: "ke-hoach-seo",
  data: {
    nguon: keHoach._nguon,
    lichDang: keHoach.lichDang,
    quyTac: keHoach.quyTac.map((noiDung: string) => ({ noiDung })),
  },
});
console.log("Xong.");
process.exit(0);
