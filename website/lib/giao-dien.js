// Dữ liệu dùng chung cho giao diện công khai (header, footer, thanh liên hệ), đọc một lần mỗi request.
import { cache } from "react";
import { layCauHinhChung } from "./cong-khai";
import { layPayload } from "./cms";

/** Kết quả giống GET /api/trang/chung (xem docs/api.md mục 1). */
export const layChung = cache(async () => layCauHinhChung(await layPayload()));

/** "tel:19001068" từ "1900 1068". Rỗng khi chưa có hotline. */
export const telHref = (hotline) => (hotline ? `tel:${hotline.replace(/[^\d+]/g, "")}` : undefined);

/** Danh sách tên khu vực đang phục vụ, lấy từ dữ liệu vùng phục vụ (không gõ cứng). */
export const tenKhuVuc = (chung) => chung.vungPhucVu.quan.map((q) => q.ten);
