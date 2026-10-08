// Kiểm tra lại toàn bộ bài đã đăng theo luật trong lib/kiem-tra.mjs (cùng luật CMS dùng khi bấm Đăng).
//   npm run kiem-tra
import { getPayload } from "payload";
import config from "../payload.config";
import { docTuLieu, slugsDangCo } from "../lib/bai";
import { noiDungSangMarkdown } from "../lib/soan-thao";
import { kiemTraBai } from "../lib/kiem-tra.mjs";

const payload = await getPayload({ config });
const { slugs, slugsDaDang } = await slugsDangCo(payload);
let soLoi = 0;
for (const loai of ["dich-vu", "cam-nang"] as const) {
  const { docs } = await payload.find({
    collection: loai, where: { _status: { equals: "published" } }, limit: 1000, depth: 0, pagination: false,
  });
  for (const doc of docs) {
    const markdown = await noiDungSangMarkdown(payload, doc.noiDung);
    const kq = kiemTraBai({ loai, data: doc, markdown, slugs, slugsDaDang, tuLieu: docTuLieu(doc.tuLieu) });
    for (const c of kq.canhBao) console.warn(`Cảnh báo  ${loai}/${doc.slug}: ${c}`);
    for (const l of kq.loi) console.error(`Lỗi      ${loai}/${doc.slug}: ${l}`);
    soLoi += kq.loi.length;
  }
}
console.log(soLoi ? `\n${soLoi} lỗi.` : `Kiểm tra bài: đạt (${slugsDaDang["dich-vu"].size} trang dịch vụ, ${slugsDaDang["cam-nang"].size} bài cẩm nang).`);
process.exit(soLoi ? 1 : 0);
