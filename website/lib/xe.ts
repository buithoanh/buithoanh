// Danh mục xe: đồng bộ từ VCparts, tra phân khúc của một dòng xe.
import type { Payload } from "payload";
import { vcparts } from "./tich-hop/vcparts";

/**
 * Kéo danh mục từ VCparts vào CMS. Hãng/dòng mới được tạo; dòng mới KHÔNG tự có phân khúc (chỉ lưu gợi ý)
 * và đánh dấu "cần gán" để Quản lý dịch vụ chọn. Không bao giờ ghi đè phân khúc đã gán.
 */
export async function dongBoDanhMucXe(payload: Payload) {
  const ds = await vcparts.layDanhMucXe();
  const luc = new Date().toISOString();
  let hangMoi = 0;
  let soDong = 0;
  const dongMoi: string[] = [];
  for (const [i, h] of ds.entries()) {
    let hang = (await payload.find({
      collection: "hang-xe", limit: 1, depth: 0,
      where: { or: [{ maVCparts: { equals: h.ma } }, { ten: { equals: h.ten } }] },
    })).docs[0];
    if (!hang) {
      hang = await payload.create({ collection: "hang-xe", data: { ten: h.ten, slug: "", maVCparts: h.ma, nguon: "vcparts", thuTu: i + 1 } });
      hangMoi++;
    } else if (!hang.maVCparts) {
      await payload.update({ collection: "hang-xe", id: hang.id, data: { maVCparts: h.ma } });
    }
    for (const d of h.dong) {
      soDong++;
      const cu = (await payload.find({
        collection: "dong-xe", limit: 1, depth: 0,
        where: { or: [{ maVCparts: { equals: d.ma } }, { and: [{ hang: { equals: hang.id } }, { ten: { equals: d.ten } }] }] },
      })).docs[0];
      const chung = {
        doiTu: d.doiTu ?? null, doiDen: d.doiDen ?? null, xeDien: Boolean(d.xeDien), maVCparts: d.ma,
        goiYPhanKhuc: d.phanKhucGoiY || null, dongBoLuc: luc,
      };
      if (cu) {
        await payload.update({ collection: "dong-xe", id: cu.id, data: chung });
      } else {
        await payload.create({ collection: "dong-xe", data: { hang: hang.id, ten: d.ten, nguon: "vcparts", ...chung } });
        dongMoi.push(`${h.ten} ${d.ten}`);
      }
    }
  }
  const { totalDocs: canGan } = await payload.count({ collection: "dong-xe", where: { canGan: { equals: true } } });
  return { luc, soHang: ds.length, hangMoi, soDong, dongMoi, canGan };
}
