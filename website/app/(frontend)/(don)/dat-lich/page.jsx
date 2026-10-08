// Đặt lịch 4 bước (thiết kế DatLich). Server dựng sẵn dữ liệu form (layTrangDatLich) và giá sơ bộ ban đầu,
// client component lo tương tác. Nhận ?dv=slug1,slug2 (chọn sẵn dịch vụ) và ?ma=MÃ (điền sẵn ô mã).
import site from "@/site.config.mjs";
import { layPayload } from "@/lib/cms";
import { layTrangDatLich, tinhBaoGiaSoBo } from "@/lib/cong-khai";
import { layChung, tenKhuVuc } from "@/lib/giao-dien";
import { NutGoi, NutZalo } from "@/components/chung/LienHe";
import JsonLd from "@/components/JsonLd";
import DatLich from "@/components/don/DatLich";
import s from "./page.module.css";

export async function generateMetadata() {
  const chung = await layChung();
  const kv = tenKhuVuc(chung);
  return {
    title: "Đặt lịch thợ sửa ô tô tận nơi",
    description: `Đặt lịch thợ tới tận nơi bảo dưỡng, thay ắc quy, lốp, phanh, đọc lỗi ô tô${kv.length ? ` ở ${kv.join(", ")}` : ` tại ${site.city}`}. Xem giá sơ bộ ngay, báo giá trước khi làm.`,
    alternates: { canonical: "/dat-lich/" },
  };
}

const motGiaTri = (v) => (Array.isArray(v) ? v.join(",") : v || "");

export default async function TrangDatLich({ searchParams }) {
  const sp = await searchParams;
  const payload = await layPayload();
  const duLieu = await layTrangDatLich(payload);

  const coDichVu = new Set(duLieu.dichVu.map((d) => d.slug));
  const dvChon = [...new Set(motGiaTri(sp?.dv).split(",").map((x) => x.trim()).filter((x) => coDichVu.has(x)))].slice(0, 6);
  const maLink = motGiaTri(sp?.ma).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 40);
  // ?hang=&dong=&doi= (link từ trang hãng xe, xe điện, khối xem giá): chọn sẵn xe nếu dòng có thật trong danh mục
  const slugSach = (v) => motGiaTri(v).trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
  const hangCo = (duLieu.hangXe || []).find((h) => h.slug === slugSach(sp?.hang));
  const dongCo = hangCo?.dong?.find((d) => d.slug === slugSach(sp?.dong));
  const doi = Number(motGiaTri(sp?.doi)) || null;
  const xeChon = dongCo ? { hang: hangCo.slug, dong: dongCo.slug, doi: doi && doi >= (dongCo.doiTu || 1980) && doi <= (dongCo.doiDen || 2100) ? doi : null } : null;
  const giaDau = await tinhBaoGiaSoBo(payload, { dichVu: dvChon, chiDichVuNhanDat: true, ...(xeChon && { dongXe: xeChon.dong }) }).catch(() => null);
  const { hotline, zalo } = duLieu.lienHe || {};

  return (
    <>
      <DatLich
        duLieu={duLieu} dvChon={dvChon} maLink={maLink} xeChon={xeChon}
        giaDau={giaDau ? { trangThai: giaDau.trangThai, hienThi: giaDau.hienThi, ghiChu: giaDau.ghiChu } : null}
        khongJs={
          <noscript>
            <div className={s.khongJs}>
              <p>Trình duyệt đang tắt JavaScript nên chưa đặt lịch trực tuyến được. Gọi hoặc nhắn Zalo để đặt lịch với nhân viên.</p>
              <div className={s.haiNut}>
                <NutGoi hotline={hotline} />
                <NutZalo zalo={zalo} />
              </div>
            </div>
          </noscript>
        }
      />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${site.url}/` },
          { "@type": "ListItem", position: 2, name: "Đặt lịch", item: `${site.url}/dat-lich/` },
        ],
      }} />
    </>
  );
}
