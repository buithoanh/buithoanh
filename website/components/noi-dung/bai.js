// Tiện ích dùng chung cho trang cẩm nang (server): tên chủ đề, chuẩn hoá chữ để tìm, thời gian đọc, mục lục từ h2/h3.
import { CHU_DE } from "@/collections/CamNang";

export const DS_CHU_DE = CHU_DE.map((c) => ({ id: c.value, ten: c.label }));
export const tenChuDe = (id) => DS_CHU_DE.find((c) => c.id === id)?.ten || null;

/** Nhãn hiển thị trên thẻ bài: chủ đề (Mẹo xe, Bắt bệnh…) nếu có, không thì nhóm từ khoá. */
export const nhanBai = (b) => tenChuDe(b.chuDe) || b.nhom || "Cẩm nang";

/** Bỏ dấu, chữ thường: "Đèn Check" → "den check". Để tìm không phân biệt dấu. */
export const boDau = (s) =>
  String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();

export function khopTuKhoa(b, q) {
  const tu = boDau(q).split(/\s+/).filter(Boolean);
  if (!tu.length) return true;
  const chu = boDau(`${b.title} ${b.description} ${b.nhom || ""} ${tenChuDe(b.chuDe) || ""}`);
  return tu.every((t) => chu.includes(t));
}

export const phutDoc = (b, html) => {
  if (b.thoiGianDocPhut) return b.thoiGianDocPhut;
  if (!html) return null;
  const soChu = String(html).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(soChu / 220));
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const giaiMa = (s) => String(s).replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const slugChu = (s) => boDau(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "muc";

/**
 * Gắn id cho mọi h2/h3 trong HTML bài và trả về mục lục: [{ id, chu, cap: 2|3 }].
 * Tiêu đề đã có id thì giữ nguyên.
 */
export function ganIdTieuDe(html) {
  const daDung = new Set();
  const mucLuc = [];
  const ra = String(html || "").replace(/<(h[23])(\s[^>]*)?>([\s\S]*?)<\/\1>/g, (_, the, thuocTinh = "", trong) => {
    const chu = giaiMa(trong.replace(/<[^>]+>/g, "")).trim();
    const coId = thuocTinh.match(/\sid="([^"]+)"/);
    let id = coId?.[1];
    if (!id) {
      const goc = slugChu(chu);
      id = goc;
      for (let i = 2; daDung.has(id); i++) id = `${goc}-${i}`;
    }
    daDung.add(id);
    if (chu) mucLuc.push({ id, chu, cap: the === "h2" ? 2 : 3 });
    return `<${the}${coId ? thuocTinh : `${thuocTinh} id="${esc(id)}"`}>${trong}</${the}>`;
  });
  return { html: ra, mucLuc };
}
