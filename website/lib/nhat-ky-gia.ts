import type { PayloadRequest } from "payload";
import { dinhDangKhoang, dinhDangTien } from "./tinh-gia.mjs";
import { VAI_TRO } from "./quyen";

type HangMuc = {
  loai?: string | null; gia?: number | null; donVi?: string | null;
  giaPhanKhuc?: Record<string, { tu?: number | null; den?: number | null } | undefined> | null;
};

/** Giá của một hạng mục dạng chữ để so sánh và ghi nhật ký: "150.000đ" hoặc "A: 1.200.000 – 1.600.000đ; B: …". */
export function moTaGia(hm: HangMuc | null | undefined): string | null {
  if (!hm) return null;
  if (hm.loai === "phuTung") {
    return ["A", "B", "C", "D"]
      .map((pk) => `${pk}: ${dinhDangKhoang(Number(hm.giaPhanKhuc?.[pk]?.tu ?? 0), Number(hm.giaPhanKhuc?.[pk]?.den ?? 0))}`)
      .join("; ");
  }
  if (hm.gia == null) return null;
  return dinhDangTien(hm.gia, { mienPhi: true }) + (hm.donVi ? `/${hm.donVi}` : "");
}

export async function ghiNhatKyGia(
  req: PayloadRequest,
  p: { hangMuc?: number | string; dichVu?: unknown; ten: string; giaCu: string | null; giaMoi: string; lyDo?: string },
) {
  const u = req.user as { id?: number; ten?: string; email?: string; vaiTro?: string } | null;
  const dichVuId = typeof p.dichVu === "object" && p.dichVu ? (p.dichVu as { id: number }).id : (p.dichVu as number | undefined);
  let tenDv = "";
  if (dichVuId) {
    const dv = await req.payload.findByID({ collection: "danh-muc-dich-vu", id: dichVuId, depth: 0, req }).catch(() => null);
    tenDv = dv?.ten ? `${dv.ten} › ` : "";
  }
  await req.payload.create({
    collection: "nhat-ky-gia",
    overrideAccess: true,
    req,
    data: {
      moTa: `${tenDv}${p.ten}`,
      hangMuc: p.hangMuc as number | undefined,
      dichVu: dichVuId,
      giaCu: p.giaCu ?? "Chưa có",
      giaMoi: p.giaMoi,
      lyDo: p.lyDo || (req.context?.lyDoNhatKy as string) || "",
      nguoi: u?.id,
      tenNguoi: u?.ten || u?.email || "Hệ thống",
      vaiTro: VAI_TRO.find((v) => v.value === u?.vaiTro)?.label.split(" (")[0] || "",
    },
  });
}
