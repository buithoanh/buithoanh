// Nút "Xem trước" trong admin trỏ vào đây. Chỉ người đã đăng nhập admin mới bật được chế độ xem bản nháp.
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { layPayload } from "../../../lib/cms";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const loai = searchParams.get("loai");
  const slug = searchParams.get("slug") || "";
  if (!["dich-vu", "cam-nang"].includes(loai) || !/^[a-z0-9-]+$/.test(slug)) {
    return new Response("Đường dẫn xem trước không hợp lệ", { status: 400 });
  }
  const payload = await layPayload();
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) return new Response("Cần đăng nhập trang admin để xem bản nháp", { status: 401 });
  (await draftMode()).enable();
  redirect(`/${loai}/${slug}/`);
}
