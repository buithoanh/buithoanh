// Doanh nghiệp (yêu cầu báo giá hợp đồng DN-) và tuyển thợ cộng tác (hồ sơ TH-): nhận form, giao người phụ trách.
import type { Payload } from "payload";
import { LoiNguoiDung, layVung } from "./cong-khai";
import {
  ANH_HO_SO, DUNG_CU, KHU_VUC_KHAC, LOAI_DOI_XE, LOAI_XE_DOANH_NGHIEP, MST, NAM_KINH_NGHIEM, chuanHoaMst, kiemTraHoSoTho, kiemTraYeuCauDoanhNghiep,
} from "./p2-dau-vao.mjs";
import { maTiepTheo } from "./ma-so";
import { lamSachDuongDan } from "./su-kien.mjs";
import { traMst } from "./tich-hop/mst";
import { thongBao } from "./tich-hop/thong-bao";
import type { TepTaiLen } from "./don/tao-don";

const khongDau = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

async function khuVucHopLe(payload: Payload) {
  const vung = await layVung(payload);
  return [...vung.quan.filter((q) => q.dangPhucVu).map((q) => ({ value: q.slug, label: q.ten })), { value: KHU_VUC_KHAC, label: "Quận khác" }];
}

/** Màn DoanhNghiep: lựa chọn của form, người phụ trách, hồ sơ năng lực. */
export async function layTrangDoanhNghiep(payload: Payload) {
  const [c, khuVuc] = await Promise.all([payload.findGlobal({ slug: "cai-dat", depth: 0 }), khuVucHopLe(payload)]);
  return {
    luaChon: { loaiXe: LOAI_XE_DOANH_NGHIEP, loaiDoiXe: LOAI_DOI_XE, khuVuc },
    phuTrach: c.salesB2B?.ten ? { ten: c.salesB2B.ten, sdt: c.salesB2B.sdt || null } : null,
    camKet: c.salesB2B?.camKet || null,
    hoSoNangLuc: c.hoSoNangLucUrl || null,
    hotline: c.hotline || "",
  };
}

/** Màn TuyenTho: lựa chọn của form, liên hệ nhân sự. */
export async function layTrangTuyenTho(payload: Payload) {
  const [c, khuVuc] = await Promise.all([payload.findGlobal({ slug: "cai-dat", depth: 0 }), khuVucHopLe(payload)]);
  return {
    luaChon: { namKinhNghiem: NAM_KINH_NGHIEM, khuVuc, dungCu: DUNG_CU },
    anh: { toiDa: ANH_HO_SO.soAnh, toiDaMB: ANH_HO_SO.toiDaMB, loai: ANH_HO_SO.loai },
    nhanSu: c.nhanSu?.ten || c.nhanSu?.zalo ? { ten: c.nhanSu?.ten || null, zalo: c.nhanSu?.zalo || null } : null,
    camKet: c.nhanSu?.camKet || null,
    hotline: c.hotline || "",
  };
}

/** Tra MST để tự điền tên, địa chỉ. Không tìm thấy: 404, khách tự gõ tên công ty. */
export async function traCuuMst(mstVao: unknown) {
  const mst = chuanHoaMst(mstVao);
  if (!MST.test(mst)) throw new LoiNguoiDung("Mã số thuế gồm 10 số (hoặc 10 số, gạch ngang, 3 số).", 400, "MST_SAI");
  let ct;
  try {
    ct = await traMst.tra(mst);
  } catch (e) {
    throw new LoiNguoiDung("Chưa tra được mã số thuế lúc này, bạn gõ tên công ty giúp nhé.", 502, "TRA_MST_LOI", { chiTiet: (e as Error).message });
  }
  if (!ct) throw new LoiNguoiDung("Không tìm thấy mã số thuế này, bạn kiểm tra lại hoặc gõ tên công ty.", 404, "KHONG_TIM_THAY_MST");
  return ct;
}

const kiemTraKhuVuc = async (payload: Payload, ds: string[]) => {
  const hopLe = new Set((await khuVucHopLe(payload)).map((k) => k.value));
  return ds.every((k) => hopLe.has(k));
};

export async function guiYeuCauDoanhNghiep(payload: Payload, duLieuTho: Record<string, unknown>) {
  const kt = kiemTraYeuCauDoanhNghiep(duLieuTho);
  if (!kt.ok) throw new LoiNguoiDung("Thông tin chưa đủ, xem từng ô.", 400, "DU_LIEU_SAI", { truong: kt.loi });
  const d = kt.duLieu as { tenCongTy: string; mst: string; diaChi: string; soXe: number; loaiXe: string; loaiDoiXe: string; khuVuc: string[]; nguoiLienHe: string; sdt: string; email: string; ghiChu: string };
  if (!(await kiemTraKhuVuc(payload, d.khuVuc))) throw new LoiNguoiDung("Khu vực bãi xe chưa đúng.", 400, "DU_LIEU_SAI", { truong: { khuVuc: "Chọn lại khu vực." } });
  // Có MST mà khách chưa có địa chỉ: tra để điền (lỗi tra cứu không chặn việc gửi)
  if (d.mst && !d.diaChi) d.diaChi = (await traMst.tra(d.mst).catch(() => null))?.diaChi || "";
  const n = (duLieuTho.nguon || {}) as Record<string, string>;
  const yc = await payload.create({
    collection: "yeu-cau-doanh-nghiep", overrideAccess: true,
    data: {
      ma: await maTiepTheo(payload, "DN"), ...d, mst: d.mst || undefined, diaChi: d.diaChi || undefined, email: d.email || undefined, ghiChu: d.ghiChu || undefined,
      loaiXe: d.loaiXe as "dien", loaiDoiXe: d.loaiDoiXe as "taxi", dongYLuc: new Date().toISOString(),
      nguon: { utmSource: String(n.utm_source || "").slice(0, 100), utmCampaign: String(n.utm_campaign || "").slice(0, 100), trangVao: n.trangVao ? lamSachDuongDan(String(n.trangVao)) : "" },
    },
  });
  const c = await payload.findGlobal({ slug: "cai-dat", depth: 0 });
  // Báo sales: SMS + email. Lỗi gửi không làm hỏng yêu cầu (đã lưu, sales vẫn thấy trong admin).
  const tom = `YEU CAU DN ${yc.ma}: ${khongDau(d.tenCongTy)}, ${d.soXe} xe (${d.loaiDoiXe}). LH ${khongDau(d.nguoiLienHe)} ${d.sdt}`;
  void thongBao.nhanNoiBo(c.salesB2B?.sdt, tom).catch((e) => payload.logger.error({ err: e, msg: `Không báo được sales ${yc.ma}` }));
  if (c.salesB2B?.email) {
    void payload.sendEmail({ to: c.salesB2B.email, subject: `Yêu cầu báo giá doanh nghiệp ${yc.ma} – ${d.tenCongTy}`, text: `${tom}\nEmail: ${d.email || "(không có)"}\nGhi chú: ${d.ghiChu || ""}` })
      .catch((e: unknown) => payload.logger.error({ err: e, msg: `Không gửi được email sales ${yc.ma}` }));
  }
  return {
    ma: yc.ma,
    phuTrach: c.salesB2B?.ten ? { ten: c.salesB2B.ten, sdt: c.salesB2B.sdt || null } : null,
    camKet: c.salesB2B?.camKet || null,
    hoSoNangLuc: c.hoSoNangLucUrl || null,
  };
}

export async function guiHoSoTho(payload: Payload, duLieuTho: Record<string, unknown>, tep: TepTaiLen[]) {
  const kt = kiemTraHoSoTho(duLieuTho);
  if (!kt.ok) throw new LoiNguoiDung("Thông tin chưa đủ, xem từng ô.", 400, "DU_LIEU_SAI", { truong: kt.loi });
  const d = kt.duLieu as { hoTen: string; sdt: string; namKinhNghiem: string; khuVuc: string[]; dungCu: string[]; ghiChu: string };
  if (!(await kiemTraKhuVuc(payload, d.khuVuc))) throw new LoiNguoiDung("Khu vực chưa đúng.", 400, "DU_LIEU_SAI", { truong: { khuVuc: "Chọn lại khu vực." } });
  if (tep.length > ANH_HO_SO.soAnh) throw new LoiNguoiDung(`Tối đa ${ANH_HO_SO.soAnh} ảnh.`, 400, "QUA_NHIEU_TEP", { truong: { anh: `Tối đa ${ANH_HO_SO.soAnh} ảnh.` } });
  if (tep.some((t) => !ANH_HO_SO.loai.includes(t.loai))) throw new LoiNguoiDung("Chỉ nhận ảnh (JPG, PNG, WEBP, HEIC).", 400, "TEP_SAI_LOAI", { truong: { anh: "Chỉ nhận ảnh." } });
  if (tep.some((t) => t.kichThuoc > ANH_HO_SO.toiDaMB * 1024 * 1024)) throw new LoiNguoiDung(`Mỗi ảnh tối đa ${ANH_HO_SO.toiDaMB} MB.`, 413, "TEP_QUA_LON");
  const ma = await maTiepTheo(payload, "TH");
  const hs = await payload.create({
    collection: "ho-so-tho", overrideAccess: true,
    data: { ma, ...d, ghiChu: d.ghiChu || undefined, namKinhNghiem: d.namKinhNghiem as "4-5", dungCu: d.dungCu as never, dongYLuc: new Date().toISOString() },
  });
  const anh: number[] = [];
  for (const t of tep) {
    const doc = await payload.create({
      collection: "tep-ho-so", overrideAccess: true, data: { hoSo: hs.id },
      file: { data: t.duLieu, mimetype: t.loai, name: `${ma}-${t.ten}`.replace(/[^\w.\-]+/g, "_"), size: t.kichThuoc },
    });
    anh.push(doc.id);
  }
  if (anh.length) await payload.update({ collection: "ho-so-tho", id: hs.id, overrideAccess: true, data: { anhChungChi: anh } });
  const c = await payload.findGlobal({ slug: "cai-dat", depth: 0 });
  void thongBao.nhanNoiBo(c.nhanSu?.sdt, `HO SO THO ${ma}: ${khongDau(d.hoTen)} ${d.sdt}, ${d.namKinhNghiem} nam, ${d.khuVuc.join(",")}`)
    .catch((e) => payload.logger.error({ err: e, msg: `Không báo được nhân sự ${ma}` }));
  return { ma, soAnh: anh.length, nhanSu: c.nhanSu?.zalo ? { ten: c.nhanSu?.ten || null, zalo: c.nhanSu.zalo } : null, camKet: c.nhanSu?.camKet || null };
}
