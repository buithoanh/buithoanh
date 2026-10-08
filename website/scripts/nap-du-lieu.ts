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

  // 12. Đơn mẫu ở mỗi trạng thái
  if ((await payload.count({ collection: "don-hang" })).totalDocs === 0) {
    const vios = (await payload.find({ collection: "dong-xe", where: { slug: { equals: "toyota-vios" } }, limit: 1 })).docs[0];
    const nay = gioVN().ngay;
    let i = 0;
    for (const tt of MOI_TRANG_THAI.map((t) => t.value)) {
      for (const loai of tt === "daNhan" ? (["datLich", "khanCap"] as const) : (["datLich"] as const)) {
        i++;
        const ngay = congNgay(nay, i % 3);
        const don = await payload.create({
          collection: "don-hang",
          data: {
            ma: await maTiepTheo(payload, "TT"),
            loai,
            dichVu: [idDanhMuc.get(loai === "khanCap" ? "ac-quy" : ["ac-quy", "bao-duong-dinh-ky", "lop", "phanh"][i % 4])!],
            suCo: loai === "khanCap" ? "Hết ắc quy" : undefined,
            xe: { hang: vios ? (vios.hang as number) : undefined, dong: vios?.id, tenXe: "Toyota Vios", doi: 2019, bienSo: `30A-${String(10000 + i * 137).slice(0, 3)}.${String(i).padStart(2, "0")}`, soKm: 40000 + i * 1000, phanKhuc: "B" },
            viTri: { diaChi: `${i} Trần Thái Tông, Dịch Vọng Hậu, Cầu Giấy`, lat: 21.031, lng: 105.789, quan: idQuan.get("Cầu Giấy"), phuong: "Dịch Vọng Hậu", trongVung: true, etaTu: 25, etaDen: 40, choDo: "ham" },
            khungGio: loai === "datLich" ? { ngay, ma: "08-10", nhan: `8h – 10h, ${ngay.slice(8)}/${ngay.slice(5, 7)}`, batDauLuc: batDauKhung(ngay, "08:00") } : undefined,
            khach: { hoTen: `Khách mẫu ${i}`, sdt: `09120000${String(i).padStart(2, "0")}` },
            dongY: { dongYXuLyDuLieu: true },
            nguon: { kenh: ["Google", "Facebook", "QR cây xăng", "Trực tiếp"][i % 4] },
            ghiChuNoiBo: "DỮ LIỆU MẪU để chạy thử",
          } as never,
        });
        // Đi qua các bước để có lịch sử trạng thái như đơn thật
        const buoc = MOI_TRANG_THAI.map((t) => t.value);
        const den = buoc.indexOf(tt);
        for (const b of tt === "huy" ? ["huy"] : buoc.slice(1, den + 1)) {
          await payload.update({ collection: "don-hang", id: don.id, data: { trangThai: b as never }, context: { khongBaoDieuPhoi: true } });
        }
      }
    }
    console.log(`+ ${i} đơn mẫu ở các trạng thái`);
  }
}
