// Trang chủ: thiết kế Main (điện thoại) + TrangChuMayTinh (máy tính ≥900px). Mọi giá, dịch vụ, khu vực, cam kết lấy từ backend.
import Link from "next/link";
import site from "@/site.config.mjs";
import { layDanhSachDichVu, layPayload } from "@/lib/cms";
import { layTrangChu } from "@/lib/cong-khai";
import JsonLd from "@/components/JsonLd";
import { NutGoi } from "@/components/chung/LienHe";
import DanhGiaKhach from "@/components/chung/DanhGiaKhach";
import Hero from "@/components/trang/Hero";
import LuoiDichVu from "@/components/trang/TheDichVu";
import BangGiaTomTat from "@/components/trang/BangGiaTomTat";
import CacBuoc from "@/components/trang/CacBuoc";
import KhoiVungPhucVu from "@/components/trang/KhoiVungPhucVu";
import KhoiDoanhNghiep from "@/components/trang/KhoiDoanhNghiep";
import XemGiaXe from "@/components/trang/XemGiaXe";
import s from "./trang-chu.module.css";

export const metadata = { alternates: { canonical: "/" } };

const diem = (n) => String(n).replace(".", ",");

export default async function TrangChu() {
  const payload = await layPayload();
  const [t, caiDat, trangDv] = await Promise.all([layTrangChu(payload), payload.findGlobal({ slug: "cai-dat", depth: 0 }), layDanhSachDichVu()]);
  // Thẻ dịch vụ chỉ trỏ tới dịch vụ đã có trang đăng
  const coTrang = new Set(trangDv.map((d) => d.slug));
  const dichVuCoTrang = t.dichVu.filter((d) => coTrang.has(d.slug));
  const { thuongHieu, lienHe, camKet, google, phapNhan, vungPhucVu } = t;
  const [dau, ...sau] = thuongHieu.slogan.split(",");
  const dichVuXemGia = t.dichVu.filter((d) => d.nhanDatLich && d.baoGiaSoBo).map((d) => ({ slug: d.slug, ten: d.ten }));

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "AutoRepair", name: thuongHieu.ten, slogan: thuongHieu.slogan, url: `${site.url}/`,
        ...(lienHe.hotline && { telephone: lienHe.hotline }),
        ...(lienHe.email && { email: lienHe.email }),
        ...(phapNhan.ten && { legalName: phapNhan.ten }),
        ...(phapNhan.mst && { taxID: phapNhan.mst }),
        ...(phapNhan.diaChi && { address: { "@type": "PostalAddress", streetAddress: phapNhan.diaChi, addressLocality: thuongHieu.thanhPho, addressCountry: "VN" } }),
        areaServed: vungPhucVu.quan.length
          ? vungPhucVu.quan.map((q) => ({ "@type": "AdministrativeArea", name: `${q.ten}, ${thuongHieu.thanhPho}` }))
          : { "@type": "City", name: thuongHieu.thanhPho },
        parentOrganization: { "@type": "Organization", name: thuongHieu.congTyMe },
        makesOffer: dichVuCoTrang.map((d) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: d.ten, url: `${site.url}/dich-vu/${d.slug}/` } })),
      }} />

      <Hero
        lon
        nhan={camKet.cuuHoPhut ? `Thợ có mặt trong ${camKet.cuuHoPhut} phút · nội thành ${thuongHieu.thanhPho}` : `Sửa ô tô tận nơi · ${thuongHieu.thanhPho}`}
        tieuDe={sau.length ? <><span className={s.dongDau}>{dau},</span> {sau.join(",").trim()}</> : thuongHieu.slogan}
        moTa={<>Ắc quy, lốp, bảo dưỡng, phanh, đọc lỗi ngay tại nhà, hầm chung cư hay bên đường. Báo giá trước, bạn đồng ý mới làm.<span className={s.chiMayTinh}> Phụ tùng chính hãng từ VCparts.</span></>}
        phai={dichVuXemGia.length ? <div className={s.chiMayTinhKhoi}><XemGiaXe dichVu={dichVuXemGia} kieu="the" /></div> : null}
      >
        <div className={s.nut}>
          <NutGoi hotline={lienHe.hotline} className={`nut nut-chinh nut-lon ${s.nutGoi}`}>
            Gọi thợ ngay<span className={s.chiMayTinh}> · {lienHe.hotline}</span>
          </NutGoi>
          <Link href="/dat-lich/" className={`nut nut-vien-trang ${s.nutDat}`}>Đặt lịch bảo dưỡng</Link>
        </div>
        <ul className={s.thongSo}>
          {camKet.cuuHoPhut ? <li><b>{camKet.cuuHoPhut} phút</b><span>có mặt cứu hộ</span></li> : null}
          <li><b>Giá công khai</b><span>báo trước khi làm</span></li>
          {camKet.baoHanhPhuTungThang ? <li><b>{camKet.baoHanhPhuTungThang} tháng</b><span>bảo hành phụ tùng</span></li> : null}
        </ul>
        <ul className={s.tinCay}>
          {google.diem ? <li>{diem(google.diem)} ★{google.soDanhGia ? ` · ${google.soDanhGia} đánh giá Google` : ""}</li> : null}
          {camKet.baoHanhPhuTungThang ? <li>Bảo hành {camKet.baoHanhPhuTungThang} tháng phụ tùng{camKet.baoHanhCongThang ? `, ${camKet.baoHanhCongThang} tháng công` : ""}</li> : null}
          <li>Hoá đơn điện tử</li>
        </ul>
      </Hero>

      <div className="wrap">
        <section className="khoi" id="dich-vu" aria-labelledby="dich-vu-h">
          <div>
            <h2 id="dich-vu-h">
              <span className={s.chiDienThoai}>Xe bạn đang cần gì?</span>
              <span className={s.chiMayTinh}>Dịch vụ tận nơi</span>
            </h2>
            <p className="phu">
              <span className={s.chiDienThoai}>Chọn việc, giá tham khảo hiện ngay.</span>
              <span className={s.chiMayTinh}>Những việc chủ xe hay cần nhất, làm ngay tại chỗ xe đỗ.</span>
            </p>
          </div>
          <LuoiDichVu dichVu={dichVuCoTrang} />
        </section>

        <div className={s.cum}>
          <BangGiaTomTat dong={t.giaNhanh} className={s.oGia} />
          <CacBuoc className={s.oBuoc} />
          <KhoiVungPhucVu chung={t} className={s.oVung} />
        </div>

        <DanhGiaKhach danhGia={t.danhGia} google={google} />
        <KhoiDoanhNghiep hoSoNangLuc={caiDat.hoSoNangLucUrl || null} />
      </div>
    </>
  );
}
