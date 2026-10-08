// Dữ liệu công khai cho từng màn hình, đọc thẳng database qua Local API của Payload.
// Endpoint /api/... (lib/api/cong-khai.ts) và trang server-side (app/(frontend)/...) dùng chung các hàm này,
// nên giá, vùng, khung giờ luôn giống nhau ở mọi nơi. Không bao giờ trả dữ liệu cá nhân của khách.
import type { Payload, Where } from "payload";
import site from "../site.config.mjs";
import { baoGiaSoBo, dinhDangKhoang, dinhDangTien, giaHangMuc, PHAN_KHUC } from "./tinh-gia.mjs";
import { ketLuanVung } from "./vung-phuc-vu.mjs";
import { gioVN, lichDat, trongGioNhanGap } from "./lich-dat.mjs";
import { CHO_DO } from "./don/dau-vao.mjs";
import { banDo } from "./tich-hop/ban-do";
import { ChuaCauHinhTichHop } from "./tich-hop/chung";

/** Lỗi do dữ liệu khách gửi: trả thẳng câu tiếng Việt cho khách, kèm mã HTTP. */
export class LoiNguoiDung extends Error {
  constructor(message: string, public status = 400, public ma = "DU_LIEU_SAI", public chiTiet?: Record<string, unknown>) {
    super(message);
  }
}

type PK = "A" | "B" | "C" | "D";
type HangMucDb = {
  id: number; ten: string; tenNgan?: string | null; loai: "cong" | "phuTung"; gia?: number | null; donVi?: string | null;
  giaPhanKhuc?: Record<string, { tu?: number | null; den?: number | null }> | null; ghiChu?: string | null;
  baoGiaSoBo?: string | null; noiBat?: boolean | null; thuTu?: number | null; capNhatGiaLuc?: string | null;
  dichVu: number | { id: number };
};

const idCua = (v: unknown) => (typeof v === "object" && v ? (v as { id: number }).id : (v as number));
const trieu = (n: number) => (n / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 });
export const khoangTrieu = (tu: number, den: number) => (tu === den ? `${trieu(tu)} triệu` : `${trieu(tu)} – ${trieu(den)} triệu`);

/** Một hạng mục ở dạng gửi cho giao diện: số (đồng) và chữ hiển thị, theo phân khúc nếu có. */
export function hangMucHienThi(hm: HangMucDb, phanKhuc?: PK | null) {
  const g = giaHangMuc(hm, phanKhuc);
  const donVi = hm.donVi ? `/${hm.donVi}` : "";
  const coBang = hm.loai === "phuTung";
  return {
    id: hm.id,
    ten: hm.ten,
    loai: hm.loai,
    loaiNhan: coBang ? (phanKhuc ? `Phụ tùng · giá xe phân khúc ${phanKhuc}` : "Phụ tùng") : "Tiền công",
    gia: g,
    giaHienThi: coBang ? dinhDangKhoang(g.tu, g.den) : g.tu === 0 ? "Miễn phí" : dinhDangTien(g.tu) + donVi,
    mienPhi: !coBang && g.tu === 0,
    donVi: hm.donVi || null,
    ghiChu: hm.ghiChu || null,
    giaTheoPhanKhuc: coBang
      ? Object.fromEntries(PHAN_KHUC.map((k) => {
        const x = giaHangMuc(hm, k);
        return [k, { ...x, hienThi: dinhDangKhoang(x.tu, x.den) }];
      }))
      : null,
    capNhatGiaLuc: hm.capNhatGiaLuc || null,
  };
}

// ---------------------------------------------------------------- phí chung, cấu hình

export async function layPhiChung(payload: Payload) {
  const g = await payload.findGlobal({ slug: "bang-gia-chung", depth: 0 });
  return {
    phiDiLai: g.phiDiLai ?? 0,
    phiKiemTra: g.phiKiemTra ?? 0,
    baoHanhPhuTungThang: g.baoHanhPhuTungThang ?? 0,
    baoHanhCongThang: g.baoHanhCongThang ?? 0,
    camKetCuuHoPhut: g.camKetCuuHoPhut ?? 0,
    coVanGoiLaiPhut: g.coVanGoiLaiPhut ?? 0,
    hienThi: { phiDiLai: dinhDangTien(g.phiDiLai ?? 0), phiKiemTra: dinhDangTien(g.phiKiemTra ?? 0) },
    phanKhuc: (g.phanKhuc || []).map((p) => ({ ma: p.ma, tenNgan: p.tenNgan, moTa: p.moTa })),
  };
}

export async function layVung(payload: Payload) {
  const [q, p] = await Promise.all([
    payload.find({ collection: "quan", limit: 200, depth: 0, pagination: false, sort: "thuTu" }),
    payload.find({ collection: "phuong", limit: 2000, depth: 0, pagination: false, sort: "ten" }),
  ]);
  const slugQuan = new Map(q.docs.map((x) => [x.id, x.slug]));
  return {
    quan: q.docs.map((x) => ({
      id: x.id, ten: x.ten, slug: x.slug, dangPhucVu: Boolean(x.dangPhucVu), etaTu: x.etaTu, etaDen: x.etaDen,
      ghiChu: x.ghiChu || "", ranhGioi: x.ranhGioi as object | undefined,
    })),
    phuong: p.docs.map((x) => ({
      ten: x.ten, quan: slugQuan.get(idCua(x.quan)) || "", dangPhucVu: Boolean(x.dangPhucVu), ghiChu: x.ghiChu || "",
    })),
  };
}

export async function layCauHinhChung(payload: Payload) {
  const [c, phi, vung] = await Promise.all([payload.findGlobal({ slug: "cai-dat", depth: 0 }), layPhiChung(payload), layVung(payload)]);
  const dangPhucVu = vung.quan.filter((q) => q.dangPhucVu);
  return {
    thuongHieu: { ten: site.name, dongPhu: site.tagline, slogan: site.slogan, thanhPho: site.city, congTyMe: site.parent },
    lienHe: {
      hotline: c.hotline || "", zalo: c.zalo || "", email: c.email || "",
      xuongDoiTac: c.xuongDoiTac || site.partnerWorkshop, chinhSachDuLieu: c.chinhSachDuLieu || "",
    },
    phapNhan: { ten: c.phapNhan || "", mst: c.mst || "", diaChi: c.diaChi || "", daThongBaoBoCongThuong: Boolean(c.daThongBaoBoCongThuong) },
    google: { diem: c.diemGoogle ?? null, soDanhGia: c.soDanhGiaGoogle ?? null, linkDanhGia: c.googleDanhGiaUrl || "" },
    camKet: {
      cuuHoPhut: phi.camKetCuuHoPhut, baoHanhPhuTungThang: phi.baoHanhPhuTungThang, baoHanhCongThang: phi.baoHanhCongThang,
      coVanGoiLaiPhut: phi.coVanGoiLaiPhut,
    },
    phi: { phiDiLai: phi.phiDiLai, phiKiemTra: phi.phiKiemTra, hienThi: phi.hienThi },
    vungPhucVu: {
      quan: dangPhucVu.map((q) => ({ ten: q.ten, slug: q.slug, etaTu: q.etaTu, etaDen: q.etaDen })),
      tenCacQuan: dangPhucVu.map((q) => q.ten).join(", "),
    },
  };
}

// ---------------------------------------------------------------- dịch vụ và bảng giá

export async function layDichVuKemGia(payload: Payload, loc: { nhanDatLich?: boolean; bangGia?: boolean } = {}) {
  const [dv, hm] = await Promise.all([
    payload.find({ collection: "danh-muc-dich-vu", limit: 100, depth: 0, pagination: false, sort: "thuTu" }),
    payload.find({ collection: "hang-muc-gia", limit: 2000, depth: 0, pagination: false, sort: "thuTu" }),
  ]);
  const theoDv = new Map<number, HangMucDb[]>();
  for (const h of hm.docs as unknown as HangMucDb[]) {
    const k = idCua(h.dichVu);
    theoDv.set(k, [...(theoDv.get(k) || []), h]);
  }
  return dv.docs
    .filter((d) => (loc.nhanDatLich ? d.nhanDatLich : true) && (loc.bangGia ? d.hienTrenBangGia !== false : true))
    .map((d) => ({
      id: d.id, ma: d.ma, ten: d.ten, slug: d.slug, moTaNgan: d.moTaNgan || "", ghiChuBangGia: d.ghiChuBangGia || "",
      nutKeuGoi: d.nutKeuGoi || "", thoiGianLam: d.thoiGianLam || "", thuTu: d.thuTu ?? 99,
      nhanDatLich: Boolean(d.nhanDatLich), baoGiaSoBo: Boolean(d.baoGiaSoBo), hienTrenBangGia: d.hienTrenBangGia !== false,
      hangMucGoc: theoDv.get(d.id) || [],
    }));
}

const tomTatCong = (hm: HangMucDb[]) => {
  // Bỏ hạng mục tính theo đơn vị (vd 15.000đ/km) khi có giá trọn gói, để "Giá công từ" không thấp ảo
  const coGia = hm.filter((h) => h.loai === "cong" && (h.gia ?? 0) > 0);
  const tronGoi = coGia.filter((h) => !h.donVi);
  const cong = (tronGoi.length ? tronGoi : coGia).map((h) => h.gia as number);
  return cong.length ? Math.min(...cong) : null;
};

/** Bảng giá đầy đủ (màn BangGia; HangXe, XeDien lọc lại theo dịch vụ). */
export async function layBangGia(payload: Payload, phanKhuc?: PK | null) {
  const [dv, phi] = await Promise.all([layDichVuKemGia(payload, { bangGia: true }), layPhiChung(payload)]);
  const capNhat = dv.flatMap((d) => d.hangMucGoc.map((h) => h.capNhatGiaLuc || "")).sort().pop() || null;
  return {
    capNhatLuc: capNhat,
    phanKhucDangChon: phanKhuc || null,
    phanKhuc: phi.phanKhuc,
    phi: { phiDiLai: phi.phiDiLai, phiKiemTra: phi.phiKiemTra, hienThi: phi.hienThi },
    baoHanh: { phuTungThang: phi.baoHanhPhuTungThang, congThang: phi.baoHanhCongThang },
    dichVu: dv.map(({ hangMucGoc, ...d }) => {
      const giaCongTu = tomTatCong(hangMucGoc);
      return {
        ...d,
        giaCongTu,
        tomTat: `${giaCongTu != null ? `Tiền công từ ${dinhDangTien(giaCongTu)} · ` : ""}${hangMucGoc.length} hạng mục`,
        hangMuc: hangMucGoc.map((h) => hangMucHienThi(h, phanKhuc)),
      };
    }),
    // Gói hội viên (P2) sẽ thêm vào đây.
    goiHoiVien: [] as unknown[],
  };
}

// ---------------------------------------------------------------- xe

export async function layDanhMucXe(payload: Payload, loc: { xeDien?: boolean; hang?: string } = {}) {
  const [hang, dong] = await Promise.all([
    payload.find({ collection: "hang-xe", limit: 200, depth: 0, pagination: false, sort: "thuTu" }),
    payload.find({ collection: "dong-xe", limit: 5000, depth: 0, pagination: false, sort: "ten" }),
  ]);
  const ds = hang.docs
    .filter((h) => !loc.hang || h.slug === loc.hang)
    .map((h) => ({
      id: h.id, ten: h.ten, slug: h.slug,
      dong: dong.docs
        .filter((d) => idCua(d.hang) === h.id && (loc.xeDien ? d.xeDien : true))
        .map((d) => ({
          id: d.id, ten: d.ten, tenDayDu: d.tenDayDu, slug: d.slug, phanKhuc: (d.phanKhuc as PK) || null,
          doiTu: d.doiTu ?? null, doiDen: d.doiDen ?? null, xeDien: Boolean(d.xeDien),
        })),
    }));
  return loc.xeDien ? ds.filter((h) => h.dong.length) : ds;
}

export async function timDongXe(payload: Payload, dongXe: string | number) {
  const where: Where = typeof dongXe === "number" || /^\d+$/.test(String(dongXe)) ? { id: { equals: Number(dongXe) } } : { slug: { equals: String(dongXe) } };
  return (await payload.find({ collection: "dong-xe", where, limit: 1, depth: 1 })).docs[0] || null;
}

// ---------------------------------------------------------------- báo giá sơ bộ

export async function tinhBaoGiaSoBo(
  payload: Payload,
  p: { dichVu: string[]; dongXe?: string | number | null; phanKhuc?: string | null; chiDichVuNhanDat?: boolean },
) {
  const slugs = [...new Set((p.dichVu || []).filter(Boolean))];
  const tatCa = await layDichVuKemGia(payload);
  const chon = slugs.map((s) => {
    const d = tatCa.find((x) => x.slug === s);
    if (!d) throw new LoiNguoiDung(`Không có dịch vụ "${s}".`, 400, "DICH_VU_KHONG_CO");
    if (p.chiDichVuNhanDat && !d.nhanDatLich) throw new LoiNguoiDung(`Dịch vụ "${d.ten}" đang tạm ngừng nhận đặt lịch.`, 409, "DICH_VU_TAM_NGUNG");
    return d;
  });
  let phanKhuc: PK | null = PHAN_KHUC.includes(p.phanKhuc as PK) ? (p.phanKhuc as PK) : null;
  let xe: { ten: string; slug: string; phanKhuc: PK | null; canGanPhanKhuc: boolean } | null = null;
  if (p.dongXe) {
    const d = await timDongXe(payload, p.dongXe);
    if (!d) throw new LoiNguoiDung("Không tìm thấy dòng xe.", 400, "XE_KHONG_CO");
    xe = { ten: d.tenDayDu || d.ten, slug: d.slug || "", phanKhuc: (d.phanKhuc as PK) || null, canGanPhanKhuc: !d.phanKhuc };
    phanKhuc = (d.phanKhuc as PK) || null;
  }
  const phi = await layPhiChung(payload);
  const kq = baoGiaSoBo({
    dichVu: chon.map((d) => ({ slug: d.slug, ten: d.ten, baoGiaSoBo: d.baoGiaSoBo, hangMuc: d.hangMucGoc })),
    phanKhuc,
    phiDiLai: phi.phiDiLai,
  });
  const hienThi = kq.trangThai === "chuaChon" ? "Chọn dịch vụ" : kq.trangThai === "coVanGoiLai" ? "Cố vấn gọi lại" : khoangTrieu(kq.tu, kq.den);
  const ghiChu = kq.trangThai === "coVanGoiLai"
    ? `Việc phức tạp: cố vấn sẽ gọi lại trong ${phi.coVanGoiLaiPhut} phút để báo giá.`
    : kq.trangThai === "coGia"
      ? `Đã gồm phí đi lại ${dinhDangTien(phi.phiDiLai)}. Giá chính thức chốt sau khi thợ kiểm tra.${!phanKhuc ? " Chưa biết dòng xe nên khoảng giá rộng." : ""}`
      : "";
  return {
    ...kq,
    phanKhuc,
    xe,
    hienThi,
    ghiChu,
    dong: kq.dong.map((d) => ({ ...d, hienThi: d.coThe ? `0 – ${dinhDangTien(d.den)}` : dinhDangKhoang(d.tu, d.den) })),
  };
}

// ---------------------------------------------------------------- vùng phục vụ

const thongBaoVung = (k: ReturnType<typeof ketLuanVung>, xuong: string) => {
  if (k.trongVung) return `Trong vùng phục vụ. Thợ tới dự kiến ${k.eta!.tu}–${k.eta!.den} phút.`;
  if (k.lyDo === "phuongTamTat") return `${k.phuong?.ten ? `Phường ${k.phuong.ten}` : "Khu này"} đang tạm ngừng phục vụ. ${"ghiChu" in k ? k.ghiChu : ""} Gọi cố vấn để được hướng dẫn, hoặc đặt kéo xe về ${xuong}.`.replace(/\s+/g, " ").trim();
  return `Địa chỉ này ngoài vùng phục vụ. Gọi cố vấn để được hướng dẫn, hoặc đặt kéo xe về ${xuong}.`;
};

/** Kiểm tra một địa chỉ hoặc toạ độ: trong vùng không, quận/phường nào, thợ tới sau bao lâu. */
export async function kiemTraVung(payload: Payload, p: { diaChi?: string; lat?: number | null; lng?: number | null }) {
  let viTri;
  try {
    if (p.lat != null && p.lng != null) viTri = await banDo.tuToaDo(p.lat, p.lng);
    else if (p.diaChi) viTri = await banDo.timDiaChi(p.diaChi);
    else throw new LoiNguoiDung("Cho biết địa chỉ hoặc toạ độ.", 400, "THIEU_VI_TRI");
  } catch (e) {
    if (e instanceof LoiNguoiDung) throw e;
    if (e instanceof ChuaCauHinhTichHop) throw new LoiNguoiDung("Chưa kiểm tra được địa chỉ lúc này. Vui lòng gọi hotline để đặt.", 503, "BAN_DO_CHUA_CAU_HINH");
    payload.logger.error({ err: e, msg: "Bản đồ lỗi" });
    throw new LoiNguoiDung("Chưa kiểm tra được địa chỉ lúc này. Thử lại, hoặc gọi hotline.", 502, "BAN_DO_LOI");
  }
  if (!viTri) {
    throw new LoiNguoiDung("Không tìm thấy địa chỉ. Gõ rõ hơn (số nhà, đường, quận) hoặc bấm lấy vị trí.", 422, "KHONG_TIM_THAY_DIA_CHI");
  }
  const [vung, c] = await Promise.all([layVung(payload), payload.findGlobal({ slug: "cai-dat", depth: 0 })]);
  const k = ketLuanVung({
    quan: vung.quan, phuong: vung.phuong, diaGioi: { quan: viTri.quan, phuong: viTri.phuong },
    toaDo: { lat: viTri.lat, lng: viTri.lng },
  });
  const quan = k.quan ? vung.quan.find((q) => q.slug === k.quan!.slug) : null;
  return {
    ...k,
    quan: k.quan && quan ? { ...k.quan, id: quan.id } : k.quan,
    viTri: { lat: viTri.lat, lng: viTri.lng, diaChi: viTri.diaChi },
    thongBao: thongBaoVung(k, c.xuongDoiTac || site.partnerWorkshop),
  };
}

// ---------------------------------------------------------------- khung giờ

export async function layLichNhanDon(payload: Payload) {
  const l = await payload.findGlobal({ slug: "lich-nhan-don", depth: 0 });
  return {
    gioNhanGap: { tu: l.gioNhanGap?.tu || "06:00", den: l.gioNhanGap?.den || "22:00" },
    soNgayDatTruoc: l.soNgayDatTruoc ?? 4,
    phutChuanBi: l.phutChuanBi ?? 60,
    khungGio: (l.khungGio || []).map((k) => ({
      ma: k.ma, batDau: k.batDau, ketThuc: k.ketThuc, soDonToiDa: k.soDonToiDa ?? 0, ngayTrongTuan: (k.ngayTrongTuan || []) as string[],
    })),
    ngayNghi: (l.ngayNghi || []).map((n) => ({ ngay: gioVN(new Date(n.ngay)).ngay, ten: n.ten || "" })),
  };
}

export async function layKhungGio(payload: Payload, p: { tuNgay?: string; soNgay?: number } = {}) {
  const l = await layLichNhanDon(payload);
  const soNgay = Math.min(Math.max(1, p.soNgay || l.soNgayDatTruoc), 30);
  const tuNgay = p.tuNgay && /^\d{4}-\d{2}-\d{2}$/.test(p.tuNgay) ? p.tuNgay : undefined;
  const ngayDau = tuNgay && tuNgay > gioVN().ngay ? tuNgay : gioVN().ngay;
  const don = await payload.find({
    collection: "don-hang", limit: 10000, depth: 0, pagination: false,
    where: { and: [{ "khungGio.ngay": { greater_than_equal: ngayDau } }, { trangThai: { not_equals: "huy" } }, { loai: { equals: "datLich" } }] },
    select: { khungGio: true },
  });
  const daDat = new Map<string, number>();
  for (const d of don.docs) {
    const k = `${d.khungGio?.ngay}|${d.khungGio?.ma}`;
    daDat.set(k, (daDat.get(k) || 0) + 1);
  }
  return {
    ngay: lichDat({ khungGio: l.khungGio, ngayNghi: l.ngayNghi.map((n) => n.ngay), daDat, soNgay, phutChuanBi: l.phutChuanBi, tuNgay }),
    ngayNghi: l.ngayNghi,
  };
}

export async function trangThaiNhanGap(payload: Payload) {
  const l = await layLichNhanDon(payload);
  return { ...l.gioNhanGap, dangNhan: trongGioNhanGap(l.gioNhanGap) };
}

// ---------------------------------------------------------------- đánh giá

export async function layDanhGia(payload: Payload, p: { quan?: string; dichVu?: string; gioiHan?: number } = {}) {
  const and: Record<string, unknown>[] = [{ hienThi: { equals: true } }];
  if (process.env.NODE_ENV === "production") and.push({ duLieuMau: { not_equals: true } });
  if (p.quan) and.push({ "quan.slug": { equals: p.quan } });
  if (p.dichVu) and.push({ "dichVu.slug": { equals: p.dichVu } });
  const r = await payload.find({
    collection: "danh-gia", where: { and } as never, sort: "-ngay", limit: Math.min(p.gioiHan || 6, 50), depth: 1,
  });
  return r.docs.map((d) => ({
    noiDung: d.noiDung, tenHienThi: d.tenHienThi, soSao: d.soSao, ngay: d.ngay,
    quan: typeof d.quan === "object" && d.quan ? { ten: d.quan.ten, slug: d.quan.slug } : null,
    phuong: d.phuong || null,
    dichVu: typeof d.dichVu === "object" && d.dichVu ? { ten: d.dichVu.ten, slug: d.dichVu.slug } : null,
    nguon: d.nguon,
  }));
}

// ---------------------------------------------------------------- từng màn hình

export async function layTrangChu(payload: Payload) {
  const [chung, dv, danhGia] = await Promise.all([layCauHinhChung(payload), layDichVuKemGia(payload, { bangGia: true }), layDanhGia(payload, { gioiHan: 3 })]);
  const giaNhanh = [
    { ten: "Phí đi lại nội thành", giaHienThi: chung.phi.hienThi.phiDiLai, gia: chung.phi.phiDiLai },
    ...dv.flatMap((d) => d.hangMucGoc.filter((h) => h.noiBat).map((h) => {
      const x = hangMucHienThi(h);
      return { ten: h.tenNgan || h.ten, giaHienThi: x.giaHienThi, gia: x.gia.tu };
    })),
  ];
  return {
    ...chung,
    dichVu: dv.map(({ hangMucGoc, ...d }) => ({ ...d, giaCongTu: tomTatCong(hangMucGoc), giaCongTuHienThi: tomTatCong(hangMucGoc) != null ? dinhDangTien(tomTatCong(hangMucGoc)!) : null })),
    giaNhanh,
    danhGia,
  };
}

export async function layTrangDichVu(payload: Payload, slug: string, opts: { draft?: boolean } = {}) {
  const dv = (await layDichVuKemGia(payload)).find((d) => d.slug === slug);
  if (!dv) return null;
  const [trang, chung, danhGia, tatCa] = await Promise.all([
    payload.find({
      collection: "dich-vu", where: { slug: { equals: slug }, ...(opts.draft ? {} : { _status: { equals: "published" } }) },
      draft: opts.draft, limit: 1, depth: 0,
    }).then((r) => r.docs[0] || null),
    layCauHinhChung(payload),
    layDanhGia(payload, { dichVu: slug, gioiHan: 6 }),
    layDichVuKemGia(payload, { bangGia: true }),
  ]);
  const { hangMucGoc, ...thongTin } = dv;
  return {
    dichVu: { ...thongTin, giaCongTu: tomTatCong(hangMucGoc) },
    bangGia: hangMucGoc.map((h) => hangMucHienThi(h)),
    phi: chung.phi,
    camKet: chung.camKet,
    trang: trang
      ? { title: trang.title, description: trang.description, ten: trang.ten, tomTat: trang.tomTat, faq: trang.faq || [], noiDung: trang.noiDung, capNhat: trang.updatedAt }
      : null,
    quan: chung.vungPhucVu.quan,
    danhGia,
    dichVuKhac: tatCa.filter((d) => d.slug !== slug).map((d) => ({ ten: d.ten, slug: d.slug, ma: d.ma })),
    lienHe: chung.lienHe,
  };
}

export async function layTrangKhuVuc(payload: Payload, dichVuSlug: string, quanSlug: string, opts: { draft?: boolean } = {}) {
  const [dvs, vung, chung, danhGia] = await Promise.all([
    layDichVuKemGia(payload, { bangGia: true }), layVung(payload), layCauHinhChung(payload), layDanhGia(payload, { quan: quanSlug, gioiHan: 6 }),
  ]);
  const dv = dvs.find((d) => d.slug === dichVuSlug);
  const quan = vung.quan.find((q) => q.slug === quanSlug && q.dangPhucVu);
  if (!dv || !quan) return null;
  const trang = (await payload.find({
    collection: "trang-khu-vuc", where: { and: [{ slug: { equals: `${dv.slug}-${quan.slug}` } }, ...(opts.draft ? [] : [{ _status: { equals: "published" } }])] },
    draft: opts.draft, limit: 1, depth: 2,
  })).docs[0];
  const { noiDungHtml } = await import("./noi-dung");
  const danhGiaTrang = trang ? (trang.danhGia || []).filter((d): d is Exclude<typeof d, number> => typeof d === "object" && Boolean(d?.hienThi)) : [];
  return {
    dichVu: { ten: dv.ten, slug: dv.slug, ma: dv.ma, moTaNgan: dv.moTaNgan },
    quan: { ten: quan.ten, slug: quan.slug, etaTu: quan.etaTu, etaDen: quan.etaDen, ghiChu: quan.ghiChu },
    phuongDangPhucVu: vung.phuong.filter((p) => p.quan === quan.slug && p.dangPhucVu).map((p) => p.ten),
    bangGia: [
      { ten: "Phí đi lại", loai: "phi", giaHienThi: chung.phi.hienThi.phiDiLai, gia: { tu: chung.phi.phiDiLai, den: chung.phi.phiDiLai } },
      ...dv.hangMucGoc.map((h) => hangMucHienThi(h)),
    ],
    // Đánh giá gắn vào trang trước, rồi các đánh giá khác ở quận
    danhGia: [
      ...danhGiaTrang.map((d) => ({ noiDung: d.noiDung, tenHienThi: d.tenHienThi, soSao: d.soSao, ngay: d.ngay, quan: { ten: quan.ten, slug: quan.slug }, phuong: d.phuong || null, dichVu: null, nguon: d.nguon })),
      ...danhGia.filter((d) => !danhGiaTrang.some((x) => x.noiDung === d.noiDung)),
    ].slice(0, 6),
    dichVuKhac: dvs.filter((d) => d.slug !== dv.slug).map((d) => ({ ten: d.ten, slug: d.slug })),
    // Trang khu vực đã đăng (null nếu chưa viết): tiêu đề, mô tả SEO, đoạn riêng, nội dung HTML (có khối giá), ảnh thật, FAQ
    noiDung: trang ? {
      title: trang.title, description: trang.description, doanRieng: trang.doanRieng,
      html: await noiDungHtml(payload, trang.noiDung), faq: trang.faq || [],
      anhThat: (trang.anhThat || []).map((a) => (typeof a === "object" && a ? { url: a.url, alt: a.alt, width: a.width, height: a.height } : null)).filter(Boolean),
      capNhat: trang.updatedAt,
    } : null,
    lienHe: chung.lienHe,
  };
}

export async function layTrangHangXe(payload: Payload, hangSlug: string, opts: { draft?: boolean } = {}) {
  const [tatCa, bangGia] = await Promise.all([layDanhMucXe(payload), layBangGia(payload)]);
  const hang = tatCa.find((h) => h.slug === hangSlug);
  if (!hang) return null;
  const trang = (await payload.find({
    collection: "trang-hang-xe", where: { and: [{ slug: { equals: hangSlug } }, ...(opts.draft ? [] : [{ _status: { equals: "published" } }])] },
    draft: opts.draft, limit: 1, depth: 1,
  })).docs[0];
  const { noiDungHtml } = await import("./noi-dung");
  return {
    hangXe: tatCa.map((h) => ({ ten: h.ten, slug: h.slug, soDong: h.dong.length })),
    hang,
    phanKhuc: bangGia.phanKhuc,
    phi: bangGia.phi,
    // Bảng giá đủ 4 phân khúc: giao diện chọn theo phân khúc của dòng xe đang chọn (giaTheoPhanKhuc).
    bangGia: bangGia.dichVu,
    // Trang hãng xe đã đăng (null nếu chưa viết). Bệnh hay gặp: dong = slug dòng xe, null = mọi dòng của hãng.
    noiDung: trang ? { title: trang.title, description: trang.description, html: await noiDungHtml(payload, trang.noiDung), faq: trang.faq || [] } : null,
    benhHayGap: trang ? (trang.benhHayGap || []).map((b) => ({
      dong: typeof b.dong === "object" && b.dong ? b.dong.slug : null, tieuDe: b.tieuDe, moTa: b.moTa,
      dichVu: typeof b.dichVu === "object" && b.dichVu ? b.dichVu.slug : null,
    })) : [],
  };
}

export async function layTrangXeDien(payload: Payload) {
  const [xe, bangGia] = await Promise.all([layDanhMucXe(payload, { xeDien: true }), layBangGia(payload)]);
  return {
    xe,
    phanKhuc: bangGia.phanKhuc,
    phi: bangGia.phi,
    dichVu: bangGia.dichVu.filter((d) => ["lop", "phanh", "ac-quy", "dieu-hoa"].includes(d.slug)),
  };
}

export async function layTrangDatLich(payload: Payload) {
  const [dv, xe, lich, chung] = await Promise.all([
    layDichVuKemGia(payload, { nhanDatLich: true }), layDanhMucXe(payload), layKhungGio(payload), layCauHinhChung(payload),
  ]);
  return {
    dichVu: dv.map((d) => ({ ma: d.ma, ten: d.ten, slug: d.slug, moTaNgan: d.moTaNgan, baoGiaSoBo: d.baoGiaSoBo })),
    hangXe: xe,
    choDo: CHO_DO,
    lich: lich.ngay,
    phi: chung.phi,
    camKet: chung.camKet,
    vungPhucVu: chung.vungPhucVu,
    lienHe: chung.lienHe,
    gioiHanTep: GIOI_HAN_TEP,
  };
}

export async function layTrangGoiGap(payload: Payload) {
  const [c, chung, gap] = await Promise.all([payload.findGlobal({ slug: "cai-dat", depth: 1 }), layCauHinhChung(payload), trangThaiNhanGap(payload)]);
  return {
    suCo: (c.suCoKhanCap || []).map((s) => ({
      ma: s.ma, ten: s.ten, moTa: s.moTa || "",
      dichVu: typeof s.dichVu === "object" && s.dichVu ? s.dichVu.slug : null,
    })),
    camKet: chung.camKet,
    vungPhucVu: chung.vungPhucVu,
    gioNhanGap: gap,
    lienHe: chung.lienHe,
  };
}

export const GIOI_HAN_TEP = { soAnh: 3, soVideo: 1, anhToiDaMB: 8, videoToiDaMB: 60, videoToiDaGiay: 30 };
