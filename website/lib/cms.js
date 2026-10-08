// Giao diện web đọc dữ liệu từ CMS ở đây (gọi thẳng database qua Local API của Payload, không qua HTTP).
import config from "@payload-config";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import { draftMode } from "next/headers";
import { getPayload } from "payload";
import { cache } from "react";
import siteConfig from "../site.config.mjs";

export const layPayload = () => getPayload({ config });

/** Đang ở chế độ xem trước (người trong công ty bấm "Xem trước" ở admin) thì đọc cả bản nháp. */
async function cheDoNhap() {
  return (await draftMode()).isEnabled;
}

const chiBaiDaDang = (draft) => (draft ? {} : { _status: { equals: "published" } });

export const laySite = cache(async () => {
  const payload = await layPayload();
  const [c, quan] = await Promise.all([
    payload.findGlobal({ slug: "cai-dat", depth: 0 }),
    payload.find({ collection: "quan", where: { dangPhucVu: { equals: true } }, sort: "thuTu", limit: 100, depth: 0, pagination: false }),
  ]);
  return {
    ...siteConfig,
    hotline: c.hotline || "",
    zalo: c.zalo || "",
    email: c.email || "",
    serviceAreas: quan.docs.map((q) => q.ten),
    partnerWorkshop: c.xuongDoiTac || siteConfig.partnerWorkshop,
  };
});

export const layDanhSachDichVu = cache(async () => {
  const payload = await layPayload();
  const { docs } = await payload.find({
    collection: "dich-vu", where: chiBaiDaDang(false), sort: "thuTu", limit: 100, depth: 0, pagination: false,
    select: { slug: true, ten: true, tomTat: true },
  });
  return docs;
});

export const layDichVu = cache(async (slug) => {
  const draft = await cheDoNhap();
  const payload = await layPayload();
  const { docs } = await payload.find({
    collection: "dich-vu", draft, where: { slug: { equals: slug }, ...chiBaiDaDang(draft) }, limit: 1, depth: 0,
  });
  return docs[0] || null;
});

export const layDanhSachBai = cache(async (gioiHan = 1000) => {
  const payload = await layPayload();
  const { docs } = await payload.find({
    collection: "cam-nang", where: chiBaiDaDang(false), sort: "-ngay", limit: gioiHan, depth: 0, pagination: false,
    select: { slug: true, title: true, description: true, nhom: true, ngay: true, capNhat: true, dichVuLienQuan: true, updatedAt: true },
  });
  return docs;
});

export const layBai = cache(async (slug) => {
  const draft = await cheDoNhap();
  const payload = await layPayload();
  const { docs } = await payload.find({
    collection: "cam-nang", draft, where: { slug: { equals: slug }, ...chiBaiDaDang(draft) }, limit: 1, depth: 1,
  });
  return docs[0] || null;
});

export { cheDoNhap };

export function sangHtml(noiDung) {
  return noiDung?.root ? convertLexicalToHTML({ data: noiDung, disableContainer: true }) : "";
}

export function demChuHtml(html) {
  return String(html).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
}

export function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
}

export function isoDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
}
