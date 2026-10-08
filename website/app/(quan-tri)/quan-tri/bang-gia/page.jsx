// Màn QtBangGia: một chỗ sửa giá cho cả website. Các tab: bảng giá, danh mục dịch vụ, hãng & đời xe, vùng phục vụ,
// giờ nhận đơn & ngày nghỉ, nhật ký giá. Đọc bằng Local API; sửa qua REST Payload (docs/api.md mục 5 "Sửa giá").
// Biên tập (VCmedia) không vào được; Marketing chỉ xem, không sửa.
import KhungQuanTri, { KhongCoQuyen } from "@/components/quan-tri/KhungQuanTri";
import TabBangGia from "@/components/quan-tri/bang-gia/TabBangGia";
import TabDichVu from "@/components/quan-tri/bang-gia/TabDichVu";
import TabHangXe from "@/components/quan-tri/bang-gia/TabHangXe";
import TabVung from "@/components/quan-tri/bang-gia/TabVung";
import TabGio from "@/components/quan-tri/bang-gia/TabGio";
import TabNhatKy from "@/components/quan-tri/bang-gia/TabNhatKy";
import q from "@/components/quan-tri/qt.module.css";
import { demChoDuyet, duoc, layNguoiQuanTri } from "@/lib/quan-tri/phien";

export const metadata = { title: "Bảng giá & dịch vụ" };

const TAB = [
  ["bang-gia", "Bảng giá"],
  ["dich-vu", "Danh mục dịch vụ"],
  ["hang-xe", "Hãng & đời xe"],
  ["vung", "Vùng phục vụ"],
  ["gio", "Giờ nhận đơn & ngày nghỉ"],
  ["nhat-ky", "Nhật ký thay đổi giá"],
];

const tatCa = (payload, collection, extra = {}) =>
  payload.find({ collection, limit: 5000, depth: 0, pagination: false, ...extra }).then((r) => r.docs);

export default async function TrangBangGia({ searchParams }) {
  const sp = await searchParams;
  const { payload, user } = await layNguoiQuanTri(`/quan-tri/bang-gia/${sp?.tab ? `?tab=${sp.tab}` : ""}`);
  const soChoDuyet = duoc(user, "baiViet") ? await demChoDuyet(payload) : 0;
  const coTab = TAB.filter(([k]) => k !== "nhat-ky" || duoc(user, "suaGia"));
  const tab = coTab.some(([k]) => k === sp?.tab) ? sp.tab : "bang-gia";
  const hienTai = tab === "vung" || tab === "gio" ? "vung" : "bang-gia";

  if (!duoc(user, "xemBangGia")) {
    return (
      <KhungQuanTri user={user} hienTai={hienTai} soChoDuyet={soChoDuyet}>
        <KhongCoQuyen
          tieuDe="Bạn không có quyền mở màn Bảng giá & dịch vụ"
          lyDo="Giá, danh mục dịch vụ, vùng phục vụ và giờ nhận đơn do Quản lý dịch vụ sửa. Muốn đổi giá trong bài, nhắn Quản lý dịch vụ."
        />
      </KhungQuanTri>
    );
  }
  const coTheSua = duoc(user, "suaGia");

  let noiDung = null;
  if (tab === "bang-gia") {
    const [dichVu, hangMuc, chung] = await Promise.all([
      tatCa(payload, "danh-muc-dich-vu", { sort: "thuTu" }),
      tatCa(payload, "hang-muc-gia", { sort: "thuTu" }),
      payload.findGlobal({ slug: "bang-gia-chung", depth: 0 }),
    ]);
    noiDung = <TabBangGia dichVu={dichVu} hangMuc={hangMuc} chung={chung} coTheSua={coTheSua} />;
  } else if (tab === "dich-vu") {
    const [dichVu, hangMuc, chung] = await Promise.all([
      tatCa(payload, "danh-muc-dich-vu", { sort: "thuTu" }),
      tatCa(payload, "hang-muc-gia", { select: { dichVu: true } }),
      payload.findGlobal({ slug: "bang-gia-chung", depth: 0 }),
    ]);
    const demHm = {};
    for (const h of hangMuc) demHm[h.dichVu] = (demHm[h.dichVu] || 0) + 1;
    noiDung = <TabDichVu dichVu={dichVu.map((d) => ({ ...d, soHangMuc: demHm[d.id] || 0 }))} coVanGoiLaiPhut={chung.coVanGoiLaiPhut} coTheSua={coTheSua} />;
  } else if (tab === "hang-xe") {
    const [hang, dong, chung] = await Promise.all([
      tatCa(payload, "hang-xe", { sort: "thuTu" }),
      tatCa(payload, "dong-xe", { select: { hang: true, tenDayDu: true, ten: true, phanKhuc: true, goiYPhanKhuc: true, canGan: true, doiTu: true, doiDen: true, dongBoLuc: true } }),
      payload.findGlobal({ slug: "bang-gia-chung", depth: 0 }),
    ]);
    noiDung = <TabHangXe hang={hang} dong={dong} phanKhuc={chung.phanKhuc || []} coTheSua={coTheSua} />;
  } else if (tab === "vung") {
    const [quan, phuong] = await Promise.all([tatCa(payload, "quan", { sort: "thuTu", select: { ranhGioi: false } }), tatCa(payload, "phuong", { sort: "ten" })]);
    noiDung = <TabVung quan={quan} phuong={phuong} coTheSua={coTheSua} />;
  } else if (tab === "gio") {
    noiDung = <TabGio lich={await payload.findGlobal({ slug: "lich-nhan-don", depth: 0 })} coTheSua={coTheSua} />;
  } else if (tab === "nhat-ky") {
    const nk = await payload.find({ collection: "nhat-ky-gia", sort: "-createdAt", limit: 100, depth: 0, overrideAccess: true });
    noiDung = <TabNhatKy dong={nk.docs} tong={nk.totalDocs} />;
  }

  return (
    <KhungQuanTri user={user} hienTai={hienTai} soChoDuyet={soChoDuyet}>
      <div className={q.dauTrang}>
        <div>
          <h1>Bảng giá &amp; dịch vụ</h1>
          <p>Một chỗ sửa giá cho cả website: bảng giá, trang dịch vụ, trang khu vực, trang hãng xe, báo giá sơ bộ và khối giá trong bài viết.</p>
        </div>
      </div>
      <nav aria-label="Các phần trong trang" className={q.dayVien}>
        {coTab.map(([k, nhan]) => (
          <a key={k} href={k === "bang-gia" ? "/quan-tri/bang-gia/" : `/quan-tri/bang-gia/?tab=${k}`} className={q.vien} aria-current={k === tab ? "page" : undefined}>
            {nhan}
          </a>
        ))}
      </nav>
      {!coTheSua ? (
        <div role="note" className={`${q.thongBao} ${q.tbTin}`}>
          <span>Bạn đang xem với vai trò chỉ đọc: không sửa được giá, danh mục, vùng phục vụ và giờ nhận đơn. Cần đổi, nhắn Quản lý dịch vụ.</span>
        </div>
      ) : null}
      {noiDung}
    </KhungQuanTri>
  );
}
