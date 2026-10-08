// Gọi API từ form luồng đơn. Không ném lỗi: luôn trả { ok, status, data } để giao diện rẽ nhánh theo data.ma.
export const LOI_MANG = "Mất kết nối, chưa gửi được. Kiểm tra mạng rồi thử lại, hoặc gọi hotline.";

export async function goiApi(url, { method = "POST", body, signal } = {}) {
  try {
    const laForm = typeof FormData !== "undefined" && body instanceof FormData;
    const r = await fetch(url, {
      method,
      headers: body && !laForm ? { "Content-Type": "application/json" } : undefined,
      body: body ? (laForm ? body : JSON.stringify(body)) : undefined,
      signal,
    });
    let data = null;
    try { data = await r.json(); } catch { data = null; }
    if (!r.ok && !data?.loi) data = { ...(data || {}), loi: r.status === 413 ? "Tệp quá lớn." : "Máy chủ đang bận, thử lại sau ít phút hoặc gọi hotline.", ma: data?.ma || "LOI_MAY_CHU" };
    return { ok: r.ok, status: r.status, data: data || {} };
  } catch (e) {
    if (e?.name === "AbortError") return { ok: false, status: -1, data: { ma: "HUY" } };
    return { ok: false, status: 0, data: { loi: LOI_MANG, ma: "LOI_MANG" } };
  }
}

/** "tel:19001068" từ "1900 1068" (bản dùng được phía trình duyệt; lib/giao-dien.js kéo theo Payload nên không import ở client). */
export const telHref = (hotline) => (hotline ? `tel:${hotline.replace(/[^\d+]/g, "")}` : undefined);
