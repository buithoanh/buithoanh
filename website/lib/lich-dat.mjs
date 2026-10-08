// Khung giờ đặt lịch: ngày nào nhận đơn, khung nào còn chỗ. Giờ tính theo Việt Nam (UTC+7, không đổi giờ mùa).

const LECH_VN = 7 * 60 * 60 * 1000;
export const THU = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Ngày (YYYY-MM-DD) và phút trong ngày theo giờ Việt Nam. */
export function gioVN(d = new Date()) {
  const v = new Date(d.getTime() + LECH_VN);
  return { ngay: v.toISOString().slice(0, 10), phut: v.getUTCHours() * 60 + v.getUTCMinutes(), thu: THU[v.getUTCDay()] };
}

export const congNgay = (ngay, n) => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const thuCua = (ngay) => THU[new Date(`${ngay}T00:00:00Z`).getUTCDay()];
const phut = (hhmm) => {
  const [h, m] = String(hhmm || "0:0").split(":").map(Number);
  return h * 60 + (m || 0);
};
const nhanGio = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
};

/** Thời điểm (UTC) bắt đầu một khung giờ, để lưu vào đơn. */
export const batDauKhung = (ngay, hhmm) => new Date(Date.parse(`${ngay}T${String(hhmm).padStart(5, "0")}:00+07:00`)).toISOString();

/**
 * @param {object} p
 * @param {{ ma: string, batDau: string, ketThuc: string, soDonToiDa: number, ngayTrongTuan: string[] }[]} p.khungGio
 * @param {string[]} p.ngayNghi                 ngày nghỉ YYYY-MM-DD
 * @param {Map<string, number>} p.daDat         `${ngay}|${ma}` → số đơn đã nhận (chưa huỷ)
 * @param {number} [p.soNgay]                   số ngày hiện ra, tính cả hôm nay
 * @param {number} [p.phutChuanBi]              khung bắt đầu trong vòng bấy nhiêu phút nữa thì không đặt được
 * @param {string} [p.tuNgay]
 * @param {Date} [p.bayGio]
 */
export function lichDat({ khungGio, ngayNghi = [], daDat = new Map(), soNgay = 4, phutChuanBi = 60, tuNgay, bayGio = new Date() }) {
  const nay = gioVN(bayGio);
  const batDau = tuNgay && tuNgay > nay.ngay ? tuNgay : nay.ngay;
  const nghi = new Set(ngayNghi);
  const ngay = [];
  for (let i = 0; i < soNgay; i++) {
    const d = congNgay(batDau, i);
    const thu = thuCua(d);
    const laNghi = nghi.has(d);
    const khung = [...khungGio]
      .sort((a, b) => phut(a.batDau) - phut(b.batDau))
      .filter((k) => (k.ngayTrongTuan || []).includes(thu))
      .map((k) => {
        const dat = daDat.get(`${d}|${k.ma}`) || 0;
        const day = dat >= (k.soDonToiDa || 0);
        const daQua = d === nay.ngay && phut(k.batDau) - nay.phut < phutChuanBi;
        return {
          ma: k.ma, batDau: k.batDau, ketThuc: k.ketThuc,
          nhan: `${nhanGio(k.batDau)} – ${nhanGio(k.ketThuc)}`,
          conCho: Math.max(0, (k.soDonToiDa || 0) - dat), day, daQua,
          datDuoc: !laNghi && !day && !daQua,
        };
      });
    ngay.push({
      ngay: d, thu, nhan: d === nay.ngay ? "Hôm nay" : thu, ngayThang: `${d.slice(8, 10)}/${d.slice(5, 7)}`,
      nghi: laNghi, khung: laNghi ? [] : khung,
    });
  }
  return ngay;
}

/** Đang trong giờ nhận đơn gấp không (vd 06:00–22:00). */
export function trongGioNhanGap({ tu, den }, bayGio = new Date()) {
  const p = gioVN(bayGio).phut;
  return p >= phut(tu) && p < phut(den);
}
