// Màn Theo dõi (TheoDoi) qua link riêng của khách. Chỉ trả thông tin của đúng đơn đó, số điện thoại đã che.
import type { Payload } from "payload";
import { LoiNguoiDung } from "../cong-khai";
import { cheSdt } from "../so-dien-thoai.mjs";
import { cacBuoc, nhanTrangThai } from "./trang-thai.mjs";
import type { Tho } from "../../payload-types";
import { thoChoKhach } from "./phuc-vu";
import { dinhDangKhoang } from "../tinh-gia.mjs";

export async function donTheoToken(payload: Payload, token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) throw new LoiNguoiDung("Link không đúng.", 404, "LINK_SAI");
  const don = (await payload.find({
    collection: "don-hang", where: { tokenTheoDoi: { equals: token } }, limit: 1, depth: 1, overrideAccess: true,
  })).docs[0];
  if (!don) throw new LoiNguoiDung("Link không đúng hoặc đơn không còn.", 404, "LINK_SAI");
  if (don.hetHanLinkLuc && new Date(don.hetHanLinkLuc).getTime() < Date.now()) {
    throw new LoiNguoiDung("Link đã hết hạn (24 giờ sau khi đơn xong). Tra lại hoá đơn, bảo hành bằng biển số xe.", 410, "LINK_HET_HAN");
  }
  const c = await payload.findGlobal({ slug: "cai-dat", depth: 0 });
  // Link đánh giá (tokenDanhGia riêng) có sau khi việc định kỳ gửi tin đánh giá; chỉ hiện khi khách chưa chấm.
  const coLinkDanhGia = Boolean(don.danhGia?.token && !don.danhGia?.luc && don.trangThai === "hoanThanh");
  return {
    ma: don.ma,
    loai: don.loai,
    trangThai: don.trangThai,
    nhanTrangThai: nhanTrangThai(don.trangThai),
    cacBuoc: cacBuoc(don.trangThai, don.lichSuTrangThai || []),
    dichVu: (don.dichVu || []).map((d) => (typeof d === "object" ? { ten: d.ten, slug: d.slug } : null)).filter(Boolean),
    suCo: don.suCo || null,
    tenSuCo: don.suCo ? (c.suCoKhanCap || []).find((x) => x.ma === don.suCo)?.ten || null : null,
    xe: { ten: don.xe?.tenXe || null, doi: don.xe?.doi ?? null, bienSo: don.xe?.bienSo || null },
    viTri: {
      diaChi: don.viTri?.diaChi || null,
      quan: typeof don.viTri?.quan === "object" && don.viTri?.quan ? don.viTri.quan.ten : null,
      etaTu: don.viTri?.etaTu ?? null, etaDen: don.viTri?.etaDen ?? null,
    },
    khungGio: don.khungGio?.nhan || null,
    khach: { hoTen: don.khach?.hoTen || null, sdt: cheSdt(don.khach?.sdt || "") },
    giaSoBo: don.giaSoBo?.trangThai ? {
      trangThai: don.giaSoBo.trangThai, tu: don.giaSoBo.tu ?? null, den: don.giaSoBo.den ?? null,
      hienThi: don.giaSoBo.tu != null && don.giaSoBo.den != null ? dinhDangKhoang(don.giaSoBo.tu, don.giaSoBo.den) : null,
    } : null,
    tho: thoChoKhach(don.tho as Tho),
    // Vị trí thợ chỉ hiện khi thợ đang tới
    viTriTho: don.trangThai === "thoDangDen" && don.viTriTho?.lat != null ? { lat: don.viTriTho.lat, lng: don.viTriTho.lng, luc: don.viTriTho.luc } : null,
    thoDuKienDenLuc: don.thoDuKienDenLuc || null,
    // Trang tiếp theo khách cần mở (giao diện hiện nút)
    viecCanLam: don.trangThai === "choDuyetBaoGia" ? "duyetBaoGia" : don.trangThai === "choThanhToan" ? "thanhToan" : coLinkDanhGia ? "danhGia" : null,
    thanhToan: don.thanhToan?.soTien ? { soTien: don.thanhToan.soTien, trangThai: don.thanhToan.trangThai } : null,
    linkDanhGia: coLinkDanhGia ? `/don/${don.danhGia!.token}/danh-gia/` : null,
    hotline: c.hotline || "",
    taoLuc: don.createdAt,
    hetHanLinkLuc: don.hetHanLinkLuc || null,
  };
}
