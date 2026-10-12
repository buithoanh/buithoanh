// Dùng trong trang server của các màn link riêng: gọi thẳng hàm lib (không qua HTTP), lỗi cho khách
// (LoiNguoiDung: link sai 404, hết hạn 410, chưa tới bước 409…) trả về dạng { loi } thay vì ném.
import { layPayload } from "@/lib/cms";

export async function thu(ham) {
  try {
    return { duLieu: await ham(await layPayload()) };
  } catch (e) {
    if (e && typeof e.status === "number" && typeof e.ma === "string") return { loi: { status: e.status, ma: e.ma, loi: e.message } };
    throw e;
  }
}

/** Metadata chung: link riêng của khách không bao giờ được Google index. */
export const khongIndex = { index: false, follow: false, nocache: true };
