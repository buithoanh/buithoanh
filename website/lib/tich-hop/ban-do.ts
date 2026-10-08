// Bản đồ, geocoding: đổi địa chỉ ↔ toạ độ, lấy tên quận/phường để kiểm tra vùng phục vụ.
// Bản thật: Google Geocoding API (GOOGLE_MAPS_API_KEY).
// LƯU Ý: từ 01/07/2025 Hà Nội bỏ cấp quận và sắp xếp lại phường. Google có thể trả tên phường mới, không có quận.
// Khi đó cần ranh giới (GeoJSON) cho từng quận trong CMS để kiểm tra theo toạ độ (xem BAN-GIAO-BE.md).
import { cheDo, dangKy, goiHttp, logGiaLap } from "./chung";

export type DiaChiBanDo = { lat: number; lng: number; diaChi: string; quan?: string; phuong?: string };

const MO_TA = dangKy({ ten: "ban-do", moTa: "Bản đồ, geocoding (Google Maps)", bien: ["GOOGLE_MAPS_API_KEY"] });

type ThanhPhan = { long_name: string; types: string[] };
function docKetQua(kq: { formatted_address: string; geometry: { location: { lat: number; lng: number } }; address_components: ThanhPhan[] }): DiaChiBanDo {
  const tim = (...loai: string[]) => kq.address_components.find((c) => loai.some((l) => c.types.includes(l)))?.long_name;
  return {
    lat: kq.geometry.location.lat,
    lng: kq.geometry.location.lng,
    diaChi: kq.formatted_address,
    quan: tim("administrative_area_level_2"),
    phuong: tim("administrative_area_level_3", "sublocality_level_1", "sublocality"),
  };
}

async function google(params: Record<string, string>) {
  const qs = new URLSearchParams({ ...params, language: "vi", region: "vn", key: process.env.GOOGLE_MAPS_API_KEY! });
  const j = (await goiHttp("Google Maps", `https://maps.googleapis.com/maps/api/geocode/json?${qs}`)) as {
    status: string; results: Parameters<typeof docKetQua>[0][]; error_message?: string;
  };
  if (j.status === "ZERO_RESULTS") return null;
  if (j.status !== "OK") throw new Error(`Google Maps lỗi ${j.status}${j.error_message ? `: ${j.error_message}` : ""}`);
  return docKetQua(j.results[0]);
}

// ---- Giả lập: khung chữ nhật gần đúng của 4 quận đợt 1 (CHỈ để chạy thử, không phải ranh giới thật) ----
const KHUNG_MAU = [
  { quan: "Cầu Giấy", lat: [21.015, 21.05], lng: [105.775, 105.805], phuong: "Dịch Vọng Hậu" },
  { quan: "Ba Đình", lat: [21.03, 21.05], lng: [105.805, 105.845], phuong: "Kim Mã" },
  { quan: "Đống Đa", lat: [21.0, 21.03], lng: [105.805, 105.845], phuong: "Láng Thượng" },
  { quan: "Thanh Xuân", lat: [20.98, 21.0], lng: [105.79, 105.83], phuong: "Nhân Chính" },
  { quan: "Hoài Đức", lat: [20.99, 21.08], lng: [105.65, 105.75], phuong: "An Khánh" },
];
const bo = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

function giaLapTuToaDo(lat: number, lng: number): DiaChiBanDo {
  const k = KHUNG_MAU.find((x) => lat >= x.lat[0] && lat <= x.lat[1] && lng >= x.lng[0] && lng <= x.lng[1]);
  return { lat, lng, diaChi: k ? `Gần ${k.phuong}, ${k.quan}, Hà Nội` : `Toạ độ ${lat.toFixed(5)}, ${lng.toFixed(5)}`, quan: k?.quan, phuong: k?.phuong };
}

function giaLapTimDiaChi(diaChi: string): DiaChiBanDo | null {
  const s = bo(diaChi);
  const k = KHUNG_MAU.find((x) => s.includes(bo(x.quan)));
  if (!k) return null;
  // Phường: lấy cụm sau chữ "phường" nếu có, không thì phường mẫu của quận
  const m = diaChi.match(/ph(ư|u)(ờ|o)ng\s+([^,]+)/i);
  return {
    lat: (k.lat[0] + k.lat[1]) / 2, lng: (k.lng[0] + k.lng[1]) / 2,
    diaChi: `${diaChi.trim()}, Hà Nội`, quan: k.quan, phuong: m ? m[3].trim() : undefined,
  };
}

export const banDo = {
  moTa: MO_TA,
  async timDiaChi(diaChi: string): Promise<DiaChiBanDo | null> {
    if (cheDo(MO_TA) === "giaLap") {
      const kq = giaLapTimDiaChi(diaChi);
      logGiaLap("ban-do", "tìm địa chỉ", { diaChi, kq });
      return kq;
    }
    return google({ address: `${diaChi}, Hà Nội, Việt Nam` });
  },
  async tuToaDo(lat: number, lng: number): Promise<DiaChiBanDo> {
    if (cheDo(MO_TA) === "giaLap") {
      const kq = giaLapTuToaDo(lat, lng);
      logGiaLap("ban-do", "đổi toạ độ ra địa chỉ", kq);
      return kq;
    }
    return (await google({ latlng: `${lat},${lng}` })) || { lat, lng, diaChi: `${lat}, ${lng}` };
  },
};
