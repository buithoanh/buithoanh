"use client";
// Gọi API của khách (link riêng) và tự hỏi lại định kỳ khi tab đang mở; ẩn tab thì dừng, mở lại thì hỏi ngay.
import { useEffect, useRef } from "react";

/** fetch JSON, không ném lỗi mạng: trả { ok, status, json }. status 0 = mất mạng. */
export async function goiApi(duongDan, { method = "GET", body, headers = {} } = {}) {
  try {
    const r = await fetch(duongDan, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    let json = null;
    try { json = await r.json(); } catch { /* không phải JSON */ }
    return { ok: r.ok, status: r.status, json: json || {} };
  } catch {
    return { ok: false, status: 0, json: { loi: "Mất kết nối mạng. Kiểm tra mạng rồi thử lại." } };
  }
}

/**
 * Gọi `hoi()` mỗi `msGian` mili giây khi tab đang hiện. `bat = false` thì dừng hẳn (vd đơn đã xong).
 */
export function useHoiLai(hoi, msGian, bat = true) {
  const ham = useRef(hoi);
  useEffect(() => { ham.current = hoi; });
  useEffect(() => {
    if (!bat) return undefined;
    let hen = null;
    const chay = () => { if (!document.hidden) Promise.resolve(ham.current()).catch(() => {}); };
    const datHen = () => { clearInterval(hen); hen = setInterval(chay, msGian); };
    const doiTab = () => {
      if (document.hidden) clearInterval(hen);
      else { chay(); datHen(); }
    };
    if (!document.hidden) datHen();
    document.addEventListener("visibilitychange", doiTab);
    return () => { clearInterval(hen); document.removeEventListener("visibilitychange", doiTab); };
  }, [msGian, bat]);
}
