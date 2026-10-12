"use client";
// Trạng thái form dùng chung cho các form P2 (hội viên, giới thiệu, doanh nghiệp, tuyển thợ):
// kiểm tra từng ô khi rời ô (onBlur) và khi đang sửa ô đã báo lỗi, gom lỗi server theo `truong`,
// khoá nút khi đang gửi, giữ nguyên dữ liệu đã nhập khi gửi lỗi.
import { useCallback, useRef, useState } from "react";

/** tienTo: tiền tố id ô nhập (khi một trang có hai form cùng tên ô). kiemTra(giaTri) → { ok, loi: { tenO: "câu lỗi" } } (dùng chung hàm của server trong lib/p2-dau-vao.mjs khi có). */
export function dungForm(giaTriDau, kiemTra, { tienTo = "" } = {}) {
  const [giaTri, datGiaTri] = useState(giaTriDau);
  const [loi, datLoi] = useState({});
  const [loiChung, datLoiChung] = useState("");
  const [dangGui, datDangGui] = useState(false);
  const daCham = useRef(new Set());
  const khoa = useRef(false);

  const loiCua = useCallback((gt, ten) => (kiemTra ? kiemTra(gt).loi?.[ten] : undefined), [kiemTra]);

  const doi = (ten, v) => {
    datGiaTri((cu) => {
      const moi = { ...cu, [ten]: v };
      if (daCham.current.has(ten) || loi[ten]) datLoi((l) => ({ ...l, [ten]: loiCua(moi, ten) }));
      return moi;
    });
  };
  const roi = (ten) => {
    daCham.current.add(ten);
    datLoi((l) => ({ ...l, [ten]: loiCua(giaTri, ten) }));
  };

  /** Gửi: kiểm tra hết, có lỗi thì đưa con trỏ tới ô lỗi đầu tiên. guiDi() trả về Response. */
  async function gui(guiDi) {
    if (khoa.current) return null;
    datLoiChung("");
    const kt = kiemTra ? kiemTra(giaTri) : { ok: true, loi: {} };
    if (!kt.ok) {
      datLoi(kt.loi);
      dieuHuongLoi(kt.loi, tienTo);
      return null;
    }
    khoa.current = true;
    datDangGui(true);
    try {
      const r = await guiDi(giaTri);
      const data = await r.json().catch(() => ({}));
      if (r.ok) return data;
      if (data.truong) {
        datLoi(data.truong);
        dieuHuongLoi(data.truong, tienTo);
      }
      if (data.truong && Object.values(data.truong).includes(data.loi)) return null; // lỗi đã hiện cạnh ô
      datLoiChung(r.status === 429 ? data.loi || "Bạn gửi hơi nhiều lần, thử lại sau ít phút." : data.loi || "Chưa gửi được, bạn thử lại giúp nhé.");
      return null;
    } catch {
      datLoiChung("Mất kết nối mạng. Kiểm tra mạng rồi bấm gửi lại, thông tin bạn nhập vẫn còn.");
      return null;
    } finally {
      khoa.current = false;
      datDangGui(false);
    }
  }

  return { giaTri, datGiaTri, doi, roi, loi, datLoi, loiChung, dangGui, gui };
}

function dieuHuongLoi(loi, tienTo) {
  const ds = Object.keys(loi).filter((k) => loi[k]).map((k) => document.getElementById(tienTo + k)).filter(Boolean);
  if (!ds.length) return;
  // Ô lỗi đứng đầu trên trang (không theo thứ tự khoá lỗi)
  ds.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  requestAnimationFrame(() => {
    const o = ds[0];
    o?.focus?.();
    o?.scrollIntoView?.({ block: "center", behavior: "smooth" });
  });
}

export const guiJson = (url, body) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
