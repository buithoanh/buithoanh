// Trang hãng xe (thiết kế HangXe): chọn dòng, đời → bảng giá bảo dưỡng đổi theo phân khúc của dòng xe.
// Có cho mọi hãng có dòng xe trong danh mục (khách tra giá được); hãng chưa có bài "Trang hãng xe" đã đăng thì để noindex
// để Google không lập chỉ mục trang chỉ có bảng giá (sitemap cũng chỉ liệt kê trang đã đăng).
import Link from "next/link";
import { notFound } from "next/navigation";
import site from "@/site.config.mjs";
import { cheDoNhap, layPayload } from "@/lib/cms";
import { layTrangHangXe, tinhBaoGiaSoBo } from "@/lib/cong-khai";
import { layChung } from "@/lib/giao-dien";
import DuongDan from "@/components/chung/DuongDan";
import Hero from "@/components/trang/Hero";
import HoiDap from "@/components/trang/HoiDap";
import NoiDungCms from "@/components/trang/NoiDungCms";
import ChonDongXe from "./ChonDongXe";
import s from "./hang-xe.module.css";

const DICH_VU_CHINH = "bao-duong-dinh-ky";

async function lay(params) {
  const { hang } = await params;
  const t = await layTrangHangXe(await layPayload(), hang, { draft: await cheDoNhap() });
  return t && t.hang.dong.length ? t : null;
}

const tieuDeMacDinh = (ten) => `Sửa, bảo dưỡng xe ${ten} tận nơi tại ${site.city}`;

export async function generateMetadata({ params }) {
  const t = await lay(params);
  if (!t) return {};
  const tenDong = t.hang.dong.slice(0, 5).map((d) => d.ten).join(", ");
  return {
    title: t.noiDung?.title || tieuDeMacDinh(t.hang.ten),
    description: t.noiDung?.description || `Bảo dưỡng, sửa xe ${t.hang.ten} (${tenDong}) tận nơi tại ${site.city}. Chọn dòng, đời xe để xem giá theo phân khúc, báo giá trước khi làm.`,
    alternates: { canonical: `/hang-xe/${t.hang.slug}/` },
    ...(!t.noiDung && { robots: { index: false, follow: true } }),
  };
}

export default async function TrangHangXe({ params, searchParams }) {
  const t = await lay(params);
  if (!t) notFound();
  const [{ dong: dongChon }, chung, payload] = await Promise.all([searchParams, layChung(), layPayload()]);
  const dv = t.bangGia.find((d) => d.slug === DICH_VU_CHINH) || t.bangGia[0];
  const uocTinh = dv?.baoGiaSoBo
    ? Object.fromEntries(await Promise.all(["A", "B", "C", "D"].map(async (k) => {
      const g = await tinhBaoGiaSoBo(payload, { dichVu: [dv.slug], phanKhuc: k });
      return [k, g.trangThai === "coGia" ? g.hienThi : null];
    })))
    : {};
  const phuTung = t.bangGia.flatMap((d) => d.hangMuc.filter((h) => h.loai === "phuTung").map((h) => ({ id: h.id, ten: h.ten, dichVu: d.ten, giaTheoPhanKhuc: h.giaTheoPhanKhuc })));
  const capNhat = t.bangGia.flatMap((d) => d.hangMuc.map((h) => h.capNhatGiaLuc || "")).sort().pop() || null;
  const tenDong = t.hang.dong.slice(0, 6).map((d) => d.ten).join(", ");
  const { camKet } = chung;

  return (
    <>
      <Hero
        duongDan={<DuongDan toi cap={[{ ten: t.hang.ten, href: `/hang-xe/${t.hang.slug}/` }]} />}
        tieuDe={`Sửa, bảo dưỡng xe ${t.hang.ten} tận nơi`}
        moTa={`${tenDong}. Chọn đúng dòng và đời xe để xem giá bảo dưỡng của xe bạn.`}
      >
        <ul className={s.nhan}>
          <li>Phụ tùng VCparts chính hãng</li>
          {camKet.baoHanhPhuTungThang ? <li>Bảo hành {camKet.baoHanhPhuTungThang} tháng phụ tùng</li> : null}
        </ul>
      </Hero>

      <div className="wrap">
        <section className="khoi" aria-labelledby="chon-hang">
          <div>
            <h2 id="chon-hang" className={s.h2}>Chọn hãng xe</h2>
            <p className="phu">{t.hangXe.filter((h) => h.soDong).length} hãng phổ biến ở {site.city}</p>
          </div>
          <ul className={s.hang}>
            {t.hangXe.filter((h) => h.soDong).map((h) => (
              <li key={h.slug}>
                <Link href={`/hang-xe/${h.slug}/`} aria-current={h.slug === t.hang.slug ? "page" : undefined} className={`${s.oHang} ${h.slug === t.hang.slug ? s.oHangChon : ""}`}>{h.ten}</Link>
              </li>
            ))}
          </ul>
        </section>

        <ChonDongXe
          hang={{ ten: t.hang.ten, slug: t.hang.slug, dong: t.hang.dong }}
          dongBanDau={typeof dongChon === "string" ? dongChon : null}
          phanKhuc={t.phanKhuc}
          dichVu={dv ? { ten: dv.ten, slug: dv.slug, hangMuc: dv.hangMuc } : null}
          phi={t.phi}
          uocTinh={uocTinh}
          phuTung={phuTung}
          benh={t.benhHayGap}
          capNhat={capNhat}
          baoHanh={{ phuTung: camKet.baoHanhPhuTungThang, cong: camKet.baoHanhCongThang }}
        />

        {t.noiDung?.html ? <div className={s.noiDung}><NoiDungCms html={t.noiDung.html} /></div> : null}
        <HoiDap faq={t.noiDung?.faq} tieuDe="Hỏi nhanh" nho />
      </div>
    </>
  );
}
