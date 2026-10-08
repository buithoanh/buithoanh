// Nạp dữ liệu ban đầu vào CMS từ thư mục du-lieu-mau/. Chạy lại nhiều lần không tạo trùng.
//   npm run nap-du-lieu
//
// Luôn nạp (cấu trúc cần có, số liệu là MẪU theo thiết kế, phải duyệt lại): trang dịch vụ, bài cẩm nang, từ khoá,
//   kế hoạch SEO, danh mục dịch vụ + bảng giá A–D, phí chung, hãng/dòng xe, quận/phường, khung giờ, ngày nghỉ,
//   sự cố gọi gấp.
// Chỉ nạp khi chạy thử (NODE_ENV khác production): hotline/pháp nhân mẫu, đánh giá khách mẫu, đơn mẫu ở mỗi
//   trạng thái, tài khoản thử cho từng vai trò. KHÔNG BAO GIỜ nạp các thứ này lên máy chạy thật.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getPayload } from "payload";
import config from "../payload.config";
import { markdownSangNoiDung } from "../lib/soan-thao";
import { dongBoDanhMucXe } from "../lib/xe";
import { maTiepTheo } from "../lib/ma-so";
import { congNgay, gioVN, batDauKhung } from "../lib/lich-dat.mjs";
import { MOI_TRANG_THAI } from "../lib/don/trang-thai.mjs";
import type { PayloadRequest } from "payload";
import { sql } from "@payloadcms/db-postgres";
import { capNhatViTriTho, danhDauXong, duyetBaoGia, nhanTien, taoBaoGia, xepTho } from "../lib/don/phuc-vu";
import { guiDanhGia, guiLinkDanhGiaDenHan } from "../lib/don/danh-gia";
import { taoTrangKhuVucTuMau } from "../lib/noi-dung";
import { taoDon } from "../lib/don/tao-don";
import { dangKyHoiVien } from "../lib/hoi-vien";
import { maCuaSdt } from "../lib/gioi-thieu";
import { guiHoSoTho, guiYeuCauDoanhNghiep } from "../lib/p2";
import { layKhungGio } from "../lib/cong-khai";

const GOC = path.resolve(process.cwd(), "du-lieu-mau");
const payload = await getPayload({ config });
const choPhepDang = { choPhepDang: true };

async function docMarkdown(thuMuc: string) {
  const dir = path.join(GOC, thuMuc);
  const tep = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  return Promise.all(tep.map(async (f) => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
    return { slug: f.replace(/\.md$/, ""), data, noiDung: await markdownSangNoiDung(payload, content) };
  }));
}

const daCo = async (collection: "dich-vu" | "cam-nang", slug: string) =>
  (await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })).docs[0];

// Bài tạo thành nháp trước, đăng sau khi đã nạp đủ (các bài dẫn link qua lại lẫn nhau).
const choDang: { collection: "dich-vu" | "cam-nang"; id: number | string }[] = [];

// 1. Trang dịch vụ
const idDichVu = new Map<string, number | string>();
for (const b of await docMarkdown("dich-vu")) {
  const cu = await daCo("dich-vu", b.slug);
  if (cu) { idDichVu.set(b.slug, cu.id); continue; }
  const doc = await payload.create({
    collection: "dich-vu",
    context: choPhepDang,
    draft: true,
    data: {
      _status: "draft", slug: b.slug, ten: b.data.ten, tomTat: b.data.tomTat, title: b.data.title,
      description: b.data.description, keyword: b.data.keyword, thuTu: b.data.thuTu ?? 99, faq: b.data.faq || [],
      giaDaDuyet: Boolean(b.data.giaDaDuyet), noiDung: b.noiDung as never, trangThaiDuyet: "daDuyet",
    },
  });
  idDichVu.set(b.slug, doc.id);
  choDang.push({ collection: "dich-vu", id: doc.id });
  console.log(`+ dịch vụ: ${b.slug}`);
}

// 2. Bài cẩm nang
const baiTheoTuKhoa = new Map<string, number | string>();
for (const b of await docMarkdown("cam-nang")) {
  const cu = await daCo("cam-nang", b.slug);
  if (cu) { baiTheoTuKhoa.set(String(cu.keyword).toLowerCase(), cu.id); continue; }
  const doc = await payload.create({
    collection: "cam-nang",
    context: choPhepDang,
    draft: true,
    data: {
      _status: "draft", slug: b.slug, title: b.data.title, description: b.data.description, keyword: b.data.keyword,
      nhom: b.data.nhom, ngay: new Date(b.data.ngay).toISOString(), faq: b.data.faq || [],
      ...(b.data.capNhat && { capNhat: new Date(b.data.capNhat).toISOString() }),
      giaDaDuyet: Boolean(b.data.giaDaDuyet), noiDung: b.noiDung as never,
      dichVuLienQuan: (b.data.dichVuLienQuan || []).map((s: string) => idDichVu.get(s)).filter(Boolean) as never,
      trangThaiDuyet: "daDuyet",
    },
  });
  baiTheoTuKhoa.set(String(b.data.keyword).toLowerCase(), doc.id);
  choDang.push({ collection: "cam-nang", id: doc.id });
  console.log(`+ cẩm nang: ${b.slug}`);
}

for (const { collection, id } of choDang) {
  await payload.update({ collection, id, context: choPhepDang, data: { _status: "published" } });
}
console.log(`Đã đăng ${choDang.length} bài.`);

// 3. Từ khoá + kế hoạch
const keHoach = JSON.parse(fs.readFileSync(path.join(GOC, "ke-hoach-seo.json"), "utf8"));
for (const nhom of keHoach.nhomTuKhoa) {
  for (const tuKhoa of nhom.tuKhoa as string[]) {
    const cu = await payload.find({ collection: "tu-khoa", where: { tuKhoa: { equals: tuKhoa } }, limit: 1 });
    if (cu.docs.length) continue;
    const bai = baiTheoTuKhoa.get(tuKhoa.toLowerCase());
    await payload.create({
      collection: "tu-khoa",
      data: {
        tuKhoa, nhom: nhom.nhom, yDinh: nhom.yDinh, luotTimThang: nhom.luotTimThang,
        dichVu: nhom.dichVu ? (idDichVu.get(nhom.dichVu) as never) : undefined,
        trangThai: bai ? "daCoBai" : nhom.nhom === "Bản đồ" ? "boQua" : "chuaViet",
        baiViet: bai as never,
        ghiChu: nhom.ghiChu,
      },
    });
    console.log(`+ từ khoá: ${tuKhoa}`);
  }
}
await payload.updateGlobal({
  slug: "ke-hoach-seo",
  data: {
    nguon: keHoach._nguon,
    lichDang: keHoach.lichDang,
    quyTac: keHoach.quyTac.map((noiDung: string) => ({ noiDung })),
  },
});
await napDuLieuP0();
console.log("Xong.");
process.exit(0);

async function napDuLieuP0() {
  const CHAY_THU = process.env.NODE_ENV !== "production";
  const docJson = (f: string) => JSON.parse(fs.readFileSync(path.join(GOC, f), "utf8"));
  const bg = docJson("bang-gia.json");
  const vung = docJson("vung.json");
  const LY_DO = "Nhập ban đầu từ dữ liệu mẫu thiết kế, cần duyệt";

  // 4. Phí chung
  const phi = await payload.findGlobal({ slug: "bang-gia-chung" });
  if (phi.phiDiLai == null) {
    await payload.updateGlobal({ slug: "bang-gia-chung", data: { ...bg.phi, phanKhuc: bg.phanKhuc, lyDoDoi: LY_DO } });
    console.log("+ phí chung, phân khúc");
  }

  // 5. Danh mục dịch vụ và hạng mục giá
  const idDanhMuc = new Map<string, number>();
  for (const [i, d] of (bg.dichVu as Record<string, any>[]).entries()) {
    let dv = (await payload.find({ collection: "danh-muc-dich-vu", where: { slug: { equals: d.slug } }, limit: 1 })).docs[0];
    if (!dv) {
      dv = await payload.create({
        collection: "danh-muc-dich-vu",
        data: {
          ma: d.ma, ten: d.ten, slug: d.slug, moTaNgan: d.moTaNgan, ghiChuBangGia: d.ghiChuBangGia, nutKeuGoi: d.nutKeuGoi,
          thoiGianLam: d.thoiGianLam, thuTu: i + 1, nhanDatLich: d.nhanDatLich !== false, baoGiaSoBo: d.baoGiaSoBo !== false,
          hienTrenBangGia: d.hienTrenBangGia !== false,
        },
      });
      for (const [j, h] of (d.hangMuc as Record<string, any>[]).entries()) {
        await payload.create({
          collection: "hang-muc-gia",
          data: {
            dichVu: dv.id, ten: h.ten, loai: h.loai, thuTu: j + 1, baoGiaSoBo: h.baoGiaSoBo || "khong", noiBat: Boolean(h.noiBat),
            tenNgan: h.tenNgan, nguonGia: h.nguonGia || "tay", donVi: h.donVi, lyDoDoi: LY_DO,
            ...(h.loai === "cong"
              ? { gia: h.gia }
              : { giaPhanKhuc: Object.fromEntries(Object.entries(h.pk as Record<string, number[]>).map(([k, [tu, den]]) => [k, { tu, den }])) }),
          },
        });
      }
      console.log(`+ dịch vụ ${d.ma}: ${d.hangMuc.length} hạng mục giá`);
    }
    idDanhMuc.set(d.slug, dv.id);
  }

  // 6. Hãng, dòng xe (qua đúng đường đồng bộ VCparts; bản giả lập đọc du-lieu-mau/xe.json)
  if ((await payload.count({ collection: "dong-xe" })).totalDocs === 0) {
    const kq = await dongBoDanhMucXe(payload);
    // Dữ liệu mẫu: gán luôn phân khúc gợi ý; dòng không có gợi ý để "cần gán" (giống dòng mới từ VCparts).
    const { docs } = await payload.find({ collection: "dong-xe", where: { goiYPhanKhuc: { exists: true } }, limit: 1000, pagination: false });
    for (const d of docs) if (d.goiYPhanKhuc) await payload.update({ collection: "dong-xe", id: d.id, data: { phanKhuc: d.goiYPhanKhuc } });
    console.log(`+ ${kq.soHang} hãng, ${kq.soDong} dòng xe (${kq.soDong - docs.length} dòng cần gán phân khúc)`);
  }

  // 7. Quận, phường
  const idQuan = new Map<string, number>();
  for (const [i, q] of (vung.quan as Record<string, any>[]).entries()) {
    let doc = (await payload.find({ collection: "quan", where: { ten: { equals: q.ten } }, limit: 1 })).docs[0];
    if (!doc) {
      doc = await payload.create({ collection: "quan", data: { ten: q.ten, slug: "", etaTu: q.eta[0], etaDen: q.eta[1], thuTu: i + 1, dangPhucVu: true, ghiChu: "Dữ liệu mẫu: đo lại thời gian tới thực tế." } });
      for (const ten of q.phuong as string[]) {
        const tat = q.phuongTat?.[ten];
        await payload.create({ collection: "phuong", data: { quan: doc.id, ten, dangPhucVu: !tat, ghiChu: tat || undefined } });
      }
      console.log(`+ quận ${q.ten}: ${q.phuong.length} phường`);
    }
    idQuan.set(q.ten, doc.id);
  }
  for (const [i, ten] of (vung.quanChuaPhucVu as string[]).entries()) {
    if (!(await payload.find({ collection: "quan", where: { ten: { equals: ten } }, limit: 1 })).docs.length) {
      await payload.create({ collection: "quan", data: { ten, slug: "", etaTu: 40, etaDen: 60, thuTu: 10 + i, dangPhucVu: false } });
    }
  }

  // 8. Khung giờ, ngày nghỉ
  const lich = await payload.findGlobal({ slug: "lich-nhan-don" });
  if (!lich.khungGio?.length) {
    const tatCa = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    await payload.updateGlobal({
      slug: "lich-nhan-don",
      data: {
        gioNhanGap: { tu: "06:00", den: "22:00" }, soNgayDatTruoc: 4, phutChuanBi: 60,
        khungGio: (vung.khungGio as Record<string, any>[]).map((k) => ({
          ma: k.ma, batDau: k.batDau, ketThuc: k.ketThuc, soDonToiDa: 4,
          ngayTrongTuan: (k.nghiCN ? tatCa.filter((t) => t !== "CN") : tatCa) as never,
        })),
        ngayNghi: (vung.ngayNghi as { ngay: string; ten: string }[]).map((n) => ({ ngay: `${n.ngay}T00:00:00.000+07:00`, ten: n.ten })),
      },
    });
    console.log("+ khung giờ, ngày nghỉ");
  }

  // 9. Cấu hình chung: sự cố gọi gấp (luôn); liên hệ, pháp nhân mẫu (chỉ khi chạy thử)
  const c = await payload.findGlobal({ slug: "cai-dat" });
  const capNhat: Record<string, unknown> = {};
  if (!c.suCoKhanCap?.length) {
    capNhat.suCoKhanCap = (vung.suCoKhanCap as Record<string, string>[]).map((s) => ({ ...s, dichVu: idDanhMuc.get(s.dichVu) }));
  }
  if (CHAY_THU && !c.hotline) {
    Object.assign(capNhat, {
      hotline: "1900 1068", zalo: "https://zalo.me/0000000000", email: "lienhe@thotoi.test",
      phapNhan: "Công ty TNHH ThợTới (MẪU)", mst: "0109876543", diaChi: "18 Trần Thái Tông, Cầu Giấy, Hà Nội",
      googleDanhGiaUrl: "https://g.page/r/MAU/review", diemGoogle: 4.9, soDanhGiaGoogle: 128,
    });
  }
  if (Object.keys(capNhat).length) {
    await payload.updateGlobal({ slug: "cai-dat", data: capNhat });
    console.log(`+ cấu hình chung (${Object.keys(capNhat).join(", ")})`);
  }

  await napGoiHoiVien();

  if (!CHAY_THU) {
    console.log("Production: bỏ qua đánh giá mẫu, đơn mẫu, tài khoản thử.");
    return;
  }

  // 10. Tài khoản thử cho từng vai trò (chỉ máy chạy thử)
  const matKhau = process.env.MAT_KHAU_TAI_KHOAN_THU || "ThoToi-ThuNghiem-2026";
  for (const [vaiTro, email, ten] of [
    ["quanTri", "quantri@thotoi.test", "Quản trị thử"],
    ["quanLyDichVu", "quanly@thotoi.test", "Trần Minh Đức (thử)"],
    ["bienTap", "bientap@thotoi.test", "Nguyễn Lan Phương (thử)"],
    ["marketing", "marketing@thotoi.test", "Marketing thử"],
    ["dieuPhoi", "dieuphoi@thotoi.test", "Điều phối thử"],
  ] as const) {
    if ((await payload.find({ collection: "users", where: { email: { equals: email } }, limit: 1 })).docs.length) continue;
    await payload.create({ collection: "users", data: { email, password: matKhau, ten, vaiTro } });
    console.log(`+ tài khoản thử ${email} (${vaiTro})`);
  }

  // 11. Đánh giá mẫu (đánh dấu duLieuMau: không bao giờ hiện khi chạy thật)
  if ((await payload.count({ collection: "danh-gia" })).totalDocs === 0) {
    const mau = [
      ["Xe chết máy dưới hầm B2 lúc 7 giờ sáng, 35 phút sau thợ tới, thay ắc quy xong kịp đi làm. Giá đúng như trên web.", "Anh T.", "Cầu Giấy", "Yên Hòa", "2027-02-12", "ac-quy"],
      ["Thợ gửi báo giá từng món qua điện thoại, mình bỏ bớt hạng mục chưa cần. Rõ ràng, không bị ép.", "Chị H.", "Đống Đa", "", "2027-02-05", "phanh"],
      ["Bảo dưỡng ngay ở bãi công ty, không mất nửa ngày ra gara. Có hoá đơn điện tử luôn.", "Anh M.", "Thanh Xuân", "", "2027-01-28", "bao-duong-dinh-ky"],
    ];
    for (const [noiDung, ten, quan, phuong, ngay, dv] of mau) {
      await payload.create({
        collection: "danh-gia",
        data: { noiDung, tenHienThi: ten, soSao: 5, ngay, quan: idQuan.get(quan)!, phuong: phuong || undefined, dichVu: idDanhMuc.get(dv), nguon: "google", hienThi: true, duLieuMau: true },
      });
    }
    console.log("+ 3 đánh giá mẫu (chỉ hiện khi chạy thử)");
  }

  await napDuLieuP1(idQuan, idDanhMuc);
  await napDuLieuP2();
}

// ---------------------------------------------------------------- P1 (chỉ khi chạy thử)
async function napDuLieuP1(idQuan: Map<string, number>, idDanhMuc: Map<string, number>) {
  const khongReq = undefined as unknown as PayloadRequest;

  // Cấu hình mẫu: tài khoản nhận tiền, CSKH, mục tiêu số liệu
  const c = await payload.findGlobal({ slug: "cai-dat" });
  if (!c.soTaiKhoan) {
    await payload.updateGlobal({
      slug: "cai-dat",
      data: {
        nganHangBin: "970436", nganHangTen: "Vietcombank – CN Hà Nội (MẪU)", soTaiKhoan: "1023456789", chuTaiKhoan: "CONG TY TNHH THOTOI MAU",
        sdtCskh: "0900000000", tenCskh: "Chị Ngọc (CSKH, mẫu)", cskhGoiLaiGio: 2, mucTieuTyLeDatLich: 4,
      },
    });
    console.log("+ tài khoản nhận tiền, CSKH mẫu");
  }

  // Thợ mẫu (tên trong thiết kế)
  const idTho: number[] = [];
  if ((await payload.count({ collection: "tho" })).totalDocs === 0) {
    // điểm, số đánh giá: giả như mang sang từ điều phối
    for (const [ten, nam, xeVan, chungChi, quan, diemSao, soDanhGia] of [
      ["Trần Minh Đức", 7, "29H-512.36", ["VCedu Bảo dưỡng", "VCedu Phanh, gầm"], "Cầu Giấy", 4.9, 214],
      ["Trần Văn Hưng", 12, "29H-488.21", ["VCedu Chẩn đoán điện", "VCedu Xe điện 12V"], "Đống Đa", 4.8, 387],
      ["Lê Quang Tuấn", 5, "29H-601.77", ["VCedu Lốp, ắc quy", "VCedu Cứu hộ"], "Thanh Xuân", 4.9, 96],
    ] as const) {
      const t = await payload.create({
        collection: "tho",
        data: { ten, soNamNghe: nam, bienSoXeVan: xeVan, chungChi: chungChi.map((x) => ({ ten: x })), khuVuc: [idQuan.get(quan)!], maBenDieuPhoi: `THO-${idTho.length + 1}`, diemSao, soDanhGia, gioiThieu: "DỮ LIỆU MẪU" },
      });
      idTho.push(t.id);
    }
    console.log("+ 3 thợ mẫu");
  } else {
    idTho.push(...(await payload.find({ collection: "tho", limit: 3 })).docs.map((t) => t.id));
  }

  // Mã khuyến mãi, mã đối tác (thiết kế QtMaKhuyenMai)
  if ((await payload.count({ collection: "ma-khuyen-mai" })).totalDocs === 0) {
    const nam = new Date().getFullYear() + 1;
    for (const [ma, loai, doiTac, kieuGiam, giaTri, giamToiDa, hetHan, soLuot, hh, tamDung] of [
      ["XANG-TDH12", "xang", "Cây xăng 12 Trần Duy Hưng", "phanTram", 10, 100000, `${nam}-12-31`, 300, 5, false],
      ["XANG-LANG07", "xang", "Cây xăng 07 Đường Láng", "soTien", 50000, null, `${nam}-12-31`, 300, 5, false],
      ["KOC-LINHXEHOP", "koc", "Linh Xế Hộp (TikTok)", "phanTram", 10, 150000, `${nam}-11-30`, 200, 8, false],
      ["BQL-GOLDSEASON", "bql", "BQL toà Gold Season, Thanh Xuân", "phanTram", 15, 150000, `${nam + 1}-03-31`, 500, 5, false],
      ["BQL-HOMECITY", "bql", "BQL chung cư Home City, Cầu Giấy", "phanTram", 15, 150000, `${nam}-12-31`, 500, 5, true],
      ["KM-THANG10", "km", "Khuyến mãi tháng 10", "soTien", 50000, null, `${nam}-10-31`, 1000, 0, false],
      ["KM-XEDIEN", "km", "Ưu đãi chủ xe điện", "phanTram", 20, 200000, "2026-09-30", 150, 0, false],
    ] as const) {
      await payload.create({
        collection: "ma-khuyen-mai",
        data: { ma, loai, doiTac, kieuGiam, giaTri, giamToiDa: giamToiDa ?? undefined, batDau: "2026-01-01", hetHan, soLuotToiDa: soLuot, hoaHongPhanTram: hh, tamDung, ghiChu: "DỮ LIỆU MẪU" },
      });
    }
    console.log("+ 7 mã khuyến mãi mẫu");
  }

  // Sự kiện số liệu 6 tháng (ngẫu nhiên, để màn số liệu có biểu đồ)
  if ((await payload.count({ collection: "su-kien" })).totalDocs === 0) {
    const db = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }).drizzle;
    await db.execute(sql.raw(`
      INSERT INTO su_kien (loai, duong_dan, kenh, phien, updated_at, created_at)
      SELECT (CASE WHEN r < 0.93 THEN 'xemTrang' WHEN r < 0.97 THEN 'bamGoi' ELSE 'bamZalo' END)::enum_su_kien_loai,
             (ARRAY['/','/dich-vu/ac-quy/','/dich-vu/bao-duong-dinh-ky/','/dich-vu/lop/','/bang-gia/','/cam-nang/den-check-engine-sang/','/dich-vu/ac-quy/cau-giay/','/hang-xe/toyota/'])[1 + floor(random() * 8)::int],
             (ARRAY['Google','Google','Google','Facebook','QR cây xăng','KOC','Zalo','Trực tiếp'])[1 + floor(random() * 8)::int],
             'mau-' || floor(random() * 100000)::text, g, g
      FROM (SELECT g, random() AS r FROM generate_series(now() - interval '180 days', now(), interval '7 minutes') AS g) x`));
    console.log("+ sự kiện số liệu mẫu 6 tháng");
  }

  // Đơn mẫu ở mỗi trạng thái, đi qua đúng luồng nghiệp vụ
  if ((await payload.count({ collection: "don-hang" })).totalDocs > 0) return;
  const vios = (await payload.find({ collection: "dong-xe", where: { slug: { equals: "toyota-vios" } }, limit: 1 })).docs[0];
  const km = (await payload.find({ collection: "ma-khuyen-mai", where: { ma: { equals: "XANG-TDH12" } }, limit: 1 })).docs[0];
  const nay = gioVN().ngay;
  const BAO_GIA = [
    { ma: "aq", ten: "Ắc quy 12V 45Ah", lyDo: "Điện áp khởi động 8,9V, dưới mức an toàn", loai: "phuTung" as const, gia: 1650000, batBuoc: true, mucDo: "canLamNgay" },
    { ma: "cong", ten: "Công thay ắc quy", lyDo: "Gồm lưu bộ nhớ xe", loai: "cong" as const, gia: 150000, batBuoc: true, mucDo: "canLamNgay" },
    { ma: "coc", ten: "Vệ sinh cọc, thay đầu cos", lyDo: "Cọc âm bị rỉ trắng", loai: "cong" as const, gia: 120000, mucDo: "nenLam" },
    { ma: "gat", ten: "Thay lưỡi gạt mưa", lyDo: "Lưỡi gạt chai, để vệt khi gạt", loai: "phuTung" as const, gia: 280000, mucDo: "coTheDeSau" },
  ];
  const buoc = MOI_TRANG_THAI.map((t) => t.value);
  let i = 0;
  // Khách chuyển khoản đúng số tiền (qua đúng đường nhận tiền của webhook ngân hàng)
  const traDu = async (ma: string, maGiaoDich: string) => {
    const d = (await payload.find({ collection: "don-hang", where: { ma: { equals: ma } }, limit: 1 })).docs[0];
    await nhanTien(payload, { maGiaoDich, soTien: d.thanhToan?.soTien || 0, noiDung: `CK ${ma.replace("-", "")}`, luc: new Date().toISOString(), nguon: "du-lieu-mau" });
  };
  const taoMau = async (tt: string, loai: "datLich" | "khanCap", them: Record<string, unknown> = {}) => {
    i++;
    const ngay = congNgay(nay, i % 3);
    const don = await payload.create({
      collection: "don-hang",
      context: { taoTuWeb: true },
      data: {
        ma: await maTiepTheo(payload, "TT"), loai,
        dichVu: [idDanhMuc.get(loai === "khanCap" ? "ac-quy" : ["ac-quy", "bao-duong-dinh-ky", "lop", "phanh"][i % 4])!],
        suCo: loai === "khanCap" ? "Hết ắc quy" : undefined,
        xe: { hang: vios ? (vios.hang as number) : undefined, dong: vios?.id, tenXe: "Toyota Vios", doi: 2019, bienSo: `30A-${String(200 + i)}.${String(10 + i).slice(-2)}`, soKm: 40000 + i * 1000, phanKhuc: "B" },
        viTri: { diaChi: `${i} Trần Thái Tông, Dịch Vọng Hậu, Cầu Giấy`, lat: 21.031, lng: 105.789, quan: idQuan.get("Cầu Giấy"), phuong: "Dịch Vọng Hậu", trongVung: true, etaTu: 25, etaDen: 40, choDo: "ham" },
        khungGio: loai === "datLich" ? { ngay, ma: "08-10", nhan: `8h – 10h, ${ngay.slice(8)}/${ngay.slice(5, 7)}`, batDauLuc: batDauKhung(ngay, "08:00") } : undefined,
        khach: { hoTen: `Khách mẫu ${i}`, sdt: `09120000${String(i).padStart(2, "0")}` },
        dongY: { dongYXuLyDuLieu: true },
        nguon: { kenh: ["Google", "Facebook", "QR cây xăng", "Trực tiếp"][i % 4], trangVao: "/dich-vu/ac-quy/" },
        ghiChuNoiBo: "DỮ LIỆU MẪU để chạy thử",
        ...them,
      } as never,
    });
    const den = buoc.indexOf(tt);
    const ctx = { khongBaoDieuPhoi: true };
    if (tt === "huy") {
      await payload.update({ collection: "don-hang", id: don.id, data: { trangThai: "huy" }, context: ctx });
      return don;
    }
    if (den >= 1) await xepTho(payload, khongReq, don.ma!, { tho: idTho[i % idTho.length], duKienDenLuc: new Date(Date.now() + 30 * 60000).toISOString() });
    if (den >= 2) await capNhatViTriTho(payload, khongReq, don.ma!, { lat: 21.028, lng: 105.795 });
    if (den >= 3) await taoBaoGia(payload, khongReq, don.ma!, { chanDoan: "Ắc quy chỉ còn 8,9V khi đề, cần thay mới.", hangMuc: BAO_GIA });
    if (den >= 4) await duyetBaoGia(payload, don.tokenTheoDoi!, { boHangMuc: ["gat"], dongY: true });
    if (den >= 5) await danhDauXong(payload, khongReq, don.ma!, { soKm: 40000 + i * 1000 + 50 });
    if (den >= 6) await traDu(don.ma!, `MAU${don.id}${Date.now()}`);
    return don;
  };
  for (const tt of buoc) {
    for (const loai of tt === "daNhan" ? (["datLich", "khanCap"] as const) : (["datLich"] as const)) await taoMau(tt, loai);
  }
  // Một đơn có mã khuyến mãi đã thanh toán (để có hoa hồng tháng này)
  await taoMau("hoanThanh", "datLich", { khuyenMai: km?.id, maKhuyenMai: km?.ma, nguon: { kenh: "QR cây xăng", maQR: km?.ma } });

  // Lịch sử xe 30A-123.45 cho màn tra cứu: 3 lần sửa đã xong
  const bienSo = "30A-123.45";
  for (const [dv, km2] of [["bao-duong-dinh-ky", 45120], ["phanh", 46300], ["ac-quy", 47950]] as const) {
    const d = await taoMau("dangSua", "datLich", { xe: { hang: vios?.hang, dong: vios?.id, tenXe: "Toyota Vios", doi: 2019, bienSo, soKm: km2, phanKhuc: "B" }, khach: { hoTen: "Nguyễn Văn Hoàng", sdt: "0912345678" }, dichVu: [idDanhMuc.get(dv)!] });
    await danhDauXong(payload, khongReq, d.ma!, { soKm: km2 });
    await traDu(d.ma!, `MAU-XE-${d.id}`);
  }
  // Đơn xong hơn 24 giờ: gửi link đánh giá, một khách khen 5 sao, một khách chấm 2 sao (tạo phiếu khiếu nại)
  // 3 đơn: 2 đã đánh giá, 1 còn link chưa dùng (cho ví dụ API và chạy thử màn đánh giá)
  const xong = (await payload.find({ collection: "don-hang", where: { trangThai: { equals: "hoanThanh" } }, limit: 3, sort: "createdAt" })).docs;
  for (const d of xong) {
    await payload.update({ collection: "don-hang", id: d.id, context: { boQuaHook: true }, data: { ketThucLuc: new Date(Date.now() - 25 * 3600000).toISOString() } });
  }
  await guiLinkDanhGiaDenHan(payload);
  const coLink = (await payload.find({ collection: "don-hang", where: { "danhGia.token": { exists: true } }, limit: 2, sort: "createdAt" })).docs;
  if (coLink[0]?.danhGia?.token) await guiDanhGia(payload, coLink[0].danhGia.token, { soSao: 5, moTa: "Thợ tới đúng giờ, làm gọn trong hầm. Giá đúng như báo." });
  if (coLink[1]?.danhGia?.token) await guiDanhGia(payload, coLink[1].danhGia.token, { soSao: 2, vanDe: ["tre"], moTa: "Thợ đến trễ gần 40 phút so với giờ hẹn, không báo trước." });
  console.log(`+ ${i} đơn mẫu (đủ các bước), lịch sử xe ${bienSo}, 1 đánh giá 5 sao, 1 phiếu khiếu nại`);

  // Trang khu vực mẫu tạo từ mẫu (bản nháp, chưa đủ điều kiện gửi duyệt)
  const quanLy = (await payload.find({ collection: "users", where: { email: { equals: "quanly@thotoi.test" } }, limit: 1 })).docs[0];
  if (quanLy && !(await payload.count({ collection: "trang-khu-vuc" })).totalDocs) {
    await taoTrangKhuVucTuMau(payload, { user: { ...quanLy, collection: "users" }, payload, context: {} } as unknown as PayloadRequest, { dichVu: "ac-quy", quan: "thanh-xuan" }).catch((e) => console.warn("Trang khu vực mẫu:", (e as Error).message));
    console.log("+ 1 trang khu vực nháp tạo từ mẫu");
  }


}

// ---------------------------------------------------------------- P2
/** Gói hội viên theo thiết kế HoiVien (luôn nạp; giá, quyền lợi là MẪU cần duyệt) và gắn quyền lợi vào hạng mục giá. */
async function napGoiHoiVien() {
  if (!(await payload.count({ collection: "goi-hoi-vien" })).totalDocs) {
    const ghiChu = "Nhập ban đầu từ thiết kế HoiVien, cần duyệt giá và quyền lợi";
    await payload.create({
      collection: "goi-hoi-vien",
      data: {
        ten: "Gói Cơ bản", slug: "co-ban", giaNam: 490000, nhan: "Đi lại ít", thuTu: 1, dangBan: true, giamCongPhanTram: 10, uuTienGoiGap: false,
        mienDiLai: { kieu: "soLan", soLan: 4 }, mienKichNo: { kieu: "soLan", soLan: 2 }, mienVaLop: { kieu: "khong" },
        loiIch: "Hợp với xe đi trong phố, vài lần gọi thợ mỗi năm.", ghiChu,
      },
    });
    await payload.create({
      collection: "goi-hoi-vien",
      data: {
        ten: "Gói An tâm", slug: "an-tam", giaNam: 1290000, nhan: "Nhiều người chọn", thuTu: 2, dangBan: true, giamCongPhanTram: 15, uuTienGoiGap: true,
        mienDiLai: { kieu: "khongGioiHan" }, mienKichNo: { kieu: "khongGioiHan" }, mienVaLop: { kieu: "khongGioiHan" },
        loiIch: "Gọi thợ bao nhiêu lần cũng không mất phí đi lại, được ưu tiên khi gọi gấp.", ghiChu,
      },
    });
    console.log("+ 2 gói hội viên (Cơ bản, An tâm)");
  }
  for (const [ten, quyenLoi] of [["Kích nổ tại chỗ", "kichNo"], ["Vá lốp không săm", "vaLop"]] as const) {
    const r = await payload.update({
      collection: "hang-muc-gia", where: { and: [{ ten: { equals: ten } }, { quyenLoiHoiVien: { exists: false } }] },
      data: { quyenLoiHoiVien: quyenLoi },
    });
    if (r.docs.length) console.log(`+ gắn quyền lợi hội viên "${quyenLoi}" cho "${ten}"`);
  }
}

/** Dữ liệu mẫu P2 (chỉ chạy thử): sales, nhân sự, mã giới thiệu, bạn bè đặt qua mã, hội viên, yêu cầu DN, hồ sơ thợ. */
async function napDuLieuP2() {
  const khongReq = undefined as unknown as PayloadRequest;
  const c = await payload.findGlobal({ slug: "cai-dat" });
  if (!c.salesB2B?.ten) {
    await payload.updateGlobal({
      slug: "cai-dat",
      data: {
        salesB2B: { ten: "Phạm Lan (mẫu)", sdt: "0900000001", email: "sales@thotoi.test" },
        nhanSu: { ten: "Phòng nhân sự (mẫu)", sdt: "0900000002", zalo: "https://zalo.me/0900000002" },
        hoSoNangLucUrl: "https://thotoi.test/ho-so-nang-luc-mau.pdf",
      },
    });
    console.log("+ sales doanh nghiệp, nhân sự mẫu");
  }
  if ((await payload.count({ collection: "hoi-vien" })).totalDocs) return;

  // Mã giới thiệu của khách mẫu Nguyễn Văn Hoàng (đã có lịch sử sửa xe 30A-123.45)
  const ma = await maCuaSdt(payload, "0912345678", "Nguyễn Văn Hoàng");
  await payload.update({ collection: "ma-gioi-thieu", id: ma.id, data: { soLuotMo: 5 } });

  // Bạn của anh Hoàng đặt đơn đầu qua mã → xong, trả tiền → anh Hoàng có 1 lượt miễn phí đi lại
  const lich = await layKhungGio(payload, { soNgay: 10 });
  const ngay = lich.ngay.find((n) => n.khung.some((k) => k.datDuoc))!;
  const khung = ngay.khung.find((k) => k.datDuoc)!;
  const datMau = (khach: { hoTen: string; sdt: string }, bienSo: string, them: Record<string, unknown> = {}) => taoDon(payload, "datLich", {
    dichVu: ["ac-quy"], xe: { hang: "toyota", dong: "toyota-vios", doi: 2020, bienSo, soKm: 30000 },
    viTri: { diaChi: "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy", choDo: "ham" },
    khungGio: { ngay: ngay.ngay, ma: khung.ma }, khach, dongY: true, ...them,
  });
  const lamXong = async (maDon: string, token: string, hangMuc: Parameters<typeof taoBaoGia>[3]["hangMuc"]) => {
    await taoBaoGia(payload, khongReq, maDon, { hangMuc });
    await duyetBaoGia(payload, token, { dongY: true });
    const d = await danhDauXong(payload, khongReq, maDon, {});
    await nhanTien(payload, { maGiaoDich: `MAU-P2-${maDon}`, soTien: d.thanhToan?.soTien || 0, noiDung: `CK ${maDon.replace("-", "")}`, luc: new Date().toISOString(), nguon: "du-lieu-mau" });
  };
  const ban = await datMau({ hoTen: "Lê Thu Trang", sdt: "0912000111" }, "30E-111.22", { maGioiThieu: ma.ma });
  await lamXong(ban.ma, ban.token, [{ ma: "cong", ten: "Công thay ắc quy", loai: "cong", gia: 150000, batBuoc: true }, { ma: "aq", ten: "Ắc quy 12V 45Ah", loai: "phuTung", gia: 1650000, batBuoc: true }]);

  // Hội viên An tâm (đã thanh toán) có một đơn được miễn đi lại, kích nổ, giảm 15% công; một đăng ký Cơ bản chờ thanh toán
  const hv = await dangKyHoiVien(payload, { goi: "an-tam", hoTen: "Trần Minh Tuấn", sdt: "0912000678", bienSo: "30G-678.90", dongY: true });
  await nhanTien(payload, { maGiaoDich: `MAU-HV-${hv.ma}`, soTien: hv.goi.soTien, noiDung: `CK ${hv.ma!.replace("-", "")}`, luc: new Date().toISOString(), nguon: "du-lieu-mau" });
  const donHv = await datMau({ hoTen: "Trần Minh Tuấn", sdt: "0912000678" }, "30G-678.90");
  await lamXong(donHv.ma, donHv.token, [
    { ma: "kich", ten: "Kích nổ tại chỗ", loai: "cong", gia: 150000, batBuoc: true },
    { ma: "coc", ten: "Vệ sinh cọc, thay đầu cos", loai: "cong", gia: 120000 },
  ]);
  await dangKyHoiVien(payload, { goi: "co-ban", hoTen: "Phạm Quốc Bảo", sdt: "0912000222", bienSo: "29A-555.66", dongY: true });
  console.log(`+ mã giới thiệu ${ma.ma} (1 bạn đã đặt qua mã), hội viên An tâm 30G-678.90 (1 đơn hưởng quyền lợi), 1 đăng ký chờ thanh toán`);

  await guiYeuCauDoanhNghiep(payload, {
    tenCongTy: "Công ty TNHH Cho thuê xe tự lái Mẫu", mst: "0101234567", soXe: 42, loaiXe: "4-5-cho", loaiDoiXe: "thue", khuVuc: ["dong-da"],
    nguoiLienHe: "Anh N. L. (mẫu)", sdt: "0912000333", email: "doixe@mau.test", ghiChu: "DỮ LIỆU MẪU", dongY: true,
  });
  await guiHoSoTho(payload, { hoTen: "Lê Văn Bình (mẫu)", sdt: "0977000444", namKinhNghiem: "4-5", khuVuc: ["cau-giay", "dong-da"], dungCu: ["obd", "kich", "bom"], ghiChu: "DỮ LIỆU MẪU", dongY: true }, []);
  console.log("+ 1 yêu cầu doanh nghiệp, 1 hồ sơ thợ mẫu");
}
