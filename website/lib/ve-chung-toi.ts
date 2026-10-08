// Dữ liệu màn VeChungToi: số liệu thật đếm từ database và đội thợ đang hoạt động (chỉ trường công khai được: tên, ảnh,
// năm nghề, khu vực, chứng chỉ, giới thiệu; không bao giờ trả số điện thoại, biển số, vị trí).
import type { Payload } from "payload";

export async function layTrangVeChungToi(payload: Payload, p: { gioiHanTho?: number } = {}) {
  const [donXong, tho] = await Promise.all([
    payload.count({ collection: "don-hang", where: { trangThai: { equals: "hoanThanh" } }, overrideAccess: true }),
    payload.find({
      collection: "tho", where: { dangHoatDong: { equals: true } }, sort: "-soNamNghe", limit: 200, depth: 1, pagination: false, overrideAccess: true,
      select: { ten: true, anh: true, soNamNghe: true, khuVuc: true, chungChi: true, gioiThieu: true },
    }),
  ]);
  const ds = tho.docs.map((t) => ({
    ten: t.ten,
    anh: typeof t.anh === "object" && t.anh?.url ? { url: t.anh.url, alt: t.anh.alt || t.ten, width: t.anh.width, height: t.anh.height } : null,
    soNamNghe: t.soNamNghe ?? null,
    khuVuc: (t.khuVuc || []).map((k) => (typeof k === "object" && k ? k.ten : null)).filter(Boolean) as string[],
    chungChi: (t.chungChi || []).map((c) => c.ten).filter(Boolean),
    gioiThieu: t.gioiThieu || "",
  }));
  return {
    soLieu: { soXeDaPhucVu: donXong.totalDocs, soThoCoChungChi: ds.filter((t) => t.chungChi.length).length, soTho: ds.length },
    doiTho: ds.slice(0, p.gioiHanTho ?? 6),
  };
}
