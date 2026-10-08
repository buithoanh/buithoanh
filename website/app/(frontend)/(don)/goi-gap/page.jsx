// Gọi thợ gấp (thiết kế GoiGap). Server dựng sẵn sự cố, cam kết phút, vùng phục vụ, giờ nhận gấp (layTrangGoiGap).
import site from "@/site.config.mjs";
import { layPayload, layDanhSachDichVu } from "@/lib/cms";
import { layTrangGoiGap } from "@/lib/cong-khai";
import { layChung, tenKhuVuc } from "@/lib/giao-dien";
import { NutGoi, NutZalo } from "@/components/chung/LienHe";
import JsonLd from "@/components/JsonLd";
import GoiGap from "@/components/don/GoiGap";
import s from "../dat-lich/page.module.css";

export async function generateMetadata() {
  const chung = await layChung();
  const kv = tenKhuVuc(chung);
  const phut = chung.camKet?.cuuHoPhut;
  return {
    title: "Gọi thợ sửa ô tô gấp, cứu hộ tận nơi",
    description: `Xe chết máy, hết ắc quy, thủng lốp giữa đường? Gửi vị trí, thợ tới${phut ? ` trong ${phut} phút` : " nhanh nhất"}${kv.length ? ` ở ${kv.join(", ")}` : ` tại ${site.city}`}.`,
    alternates: { canonical: "/goi-gap/" },
  };
}

export default async function TrangGoiGap() {
  const payload = await layPayload();
  const [duLieu, chung, dichVu] = await Promise.all([layTrangGoiGap(payload), layChung(), layDanhSachDichVu().catch(() => [])]);
  const keoXe = dichVu.find((d) => /keo-xe|cuu-ho/.test(d.slug));
  const { hotline, zalo } = duLieu.lienHe || {};
  const th = chung.thuongHieu || {};

  return (
    <>
      <GoiGap
        duLieu={duLieu}
        thuongHieu={[th.ten, th.dongPhu].filter(Boolean).join(" · ")}
        linkKeoXe={keoXe ? `/dich-vu/${keoXe.slug}/` : null}
        khongJs={
          <noscript>
            <div className={s.khongJs}>
              <p>Trình duyệt đang tắt JavaScript nên chưa gửi vị trí được. Gọi ngay hotline để được điều thợ.</p>
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
          { "@type": "ListItem", position: 2, name: "Gọi thợ gấp", item: `${site.url}/goi-gap/` },
        ],
      }} />
    </>
  );
}
