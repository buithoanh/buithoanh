import type { CollectionConfig } from "payload";
import { la } from "../lib/quyen";
import { LOAI_SU_KIEN, lamSachSuKien } from "../lib/su-kien.mjs";
import { kenhNguon } from "../lib/don/nguon.mjs";
import { gioiHan, ipCua, json, traLoi } from "../lib/api/chung";
import { LoiNguoiDung } from "../lib/cong-khai";
import { baoCaoSoLieu, bangSoLieu } from "../lib/so-lieu";
import { sangXlsx, traFile } from "../lib/xuat-file";

const xemSoLieu = ({ req }: { req: Parameters<typeof la>[0] }) => la(req, "quanTri", "quanLyDichVu", "marketing");

// Sự kiện số liệu (xem trang, bấm gọi, bấm Zalo, gửi form) kèm nguồn. Không có dữ liệu cá nhân, không lưu IP.
export const SuKien: CollectionConfig = {
  slug: "su-kien",
  labels: { singular: "Sự kiện", plural: "Sự kiện số liệu" },
  admin: { useAsTitle: "loai", defaultColumns: ["createdAt", "loai", "duongDan", "kenh"], group: "Marketing" },
  defaultSort: "-createdAt",
  access: { read: xemSoLieu, create: () => false, update: () => false, delete: () => false },
  endpoints: [
    {
      // Công khai. Body: một sự kiện hoặc { suKien: [...] } (tối đa 20)
      path: "/ghi",
      method: "post",
      handler: async (req) => {
        try {
          gioiHan(`su-kien:ip:${ipCua(req)}`, 300, 10);
          const body = (req.json ? await req.json().catch(() => null) : null) as { suKien?: unknown[] } | null;
          const ds = (Array.isArray(body?.suKien) ? body!.suKien : [body]).slice(0, 20);
          let soGhi = 0;
          for (const e of ds) {
            const sk = lamSachSuKien(e);
            if (!sk) continue;
            await req.payload.create({ collection: "su-kien", overrideAccess: true, data: { ...sk, kenh: kenhNguon({ ...sk, maKhuyenMai: sk.maQR }) } });
            soGhi++;
          }
          return json({ soGhi }, 202);
        } catch (e) {
          return traLoi(req, e);
        }
      },
    },
    {
      // Màn QtSoLieu: ?ky=ngay|tuan|thang&soKy=6&dinhDang=json|xlsx
      path: "/bao-cao",
      method: "get",
      handler: async (req) => {
        try {
          if (!xemSoLieu({ req })) throw new LoiNguoiDung("Không có quyền xem số liệu.", 403, "KHONG_CO_QUYEN");
          const ky = (["ngay", "tuan", "thang"].includes(req.searchParams.get("ky") || "") ? req.searchParams.get("ky") : "thang") as "ngay";
          const bc = await baoCaoSoLieu(req.payload, { ky, soKy: Number(req.searchParams.get("soKy")) || undefined });
          if (req.searchParams.get("dinhDang") === "xlsx") return traFile(await sangXlsx(bangSoLieu(bc)), `so-lieu-${ky}-${bc.nhan.at(-1)}.xlsx`.replace(/\//g, "-"), "xlsx");
          return json(bc);
        } catch (e) {
          return traLoi(req, e);
        }
      },
    },
  ],
  fields: [
    { type: "row", fields: [
      { name: "loai", label: "Loại", type: "select", required: true, index: true, options: LOAI_SU_KIEN.map((v: string) => ({ label: v, value: v })) },
      { name: "duongDan", label: "Trang", type: "text", index: true },
      { name: "kenh", label: "Kênh", type: "text", index: true },
    ] },
    { type: "row", fields: [
      { name: "utmSource", type: "text" }, { name: "utmMedium", type: "text" }, { name: "utmCampaign", type: "text" },
      { name: "maQR", label: "Mã QR / đối tác", type: "text" },
    ] },
    { name: "referrer", label: "Đến từ", type: "text" },
    { name: "phien", label: "Mã phiên (ngẫu nhiên, không định danh)", type: "text", index: true },
  ],
};
