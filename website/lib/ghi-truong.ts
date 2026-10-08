// Ghi riêng vài trường của một bản ghi, KHÔNG đọc–ghi lại cả bản ghi và không chạy hook.
// Dùng cho việc chạy nền (kết quả gửi điều phối, nhắn tin, tiền về, hoá đơn…): nếu dùng payload.update, Payload ghi lại
// toàn bộ bản ghi từ bản đọc lúc bắt đầu, nên có thể ghi đè thay đổi xảy ra cùng lúc (vd đơn vừa bị huỷ lại "sống" lại).
import type { CollectionSlug, Payload } from "payload";

export async function ghiTruong(payload: Payload, collection: CollectionSlug, id: number | string, data: Record<string, unknown>) {
  await payload.db.updateOne({ collection, id, data } as Parameters<Payload["db"]["updateOne"]>[0]);
}
