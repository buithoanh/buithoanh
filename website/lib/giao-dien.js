// Dữ liệu dùng chung cho giao diện công khai (header, footer, thanh liên hệ), đọc một lần mỗi request.
import { cache } from "react";
import { layCauHinhChung } from "./cong-khai";
import { layPayload } from "./cms";

/** Kết quả giống GET /api/trang/chung (xem docs/api.md mục 1). */
export const layChung = cache(async () => layCauHinhChung(await layPayload()));

// telHref ở lib/tel.js (thuần) để client component dùng được mà không kéo Payload vào bundle trình duyệt.
export { telHref } from "./tel";

/** Danh sách tên khu vực đang phục vụ, lấy từ dữ liệu vùng phục vụ (không gõ cứng). */
export const tenKhuVuc = (chung) => chung.vungPhucVu.quan.map((q) => q.ten);
