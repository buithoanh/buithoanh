// Màn TraCuuXe: tra lịch sử sửa, bảo hành còn lại, mốc bảo dưỡng theo biển số (xác nhận bằng mã Zalo/SMS).
// Trang công khai, được index; phần nhập biển số / mã là client component nhỏ.
import { layChung } from "@/lib/giao-dien";
import DuongDan from "@/components/chung/DuongDan";
import JsonLd from "@/components/JsonLd";
import TraCuuXe from "@/components/phuc-vu/TraCuuXe";
import site from "@/site.config.mjs";

const MO_TA = "Nhập biển số, nhận mã 6 số qua Zalo để xem xe đã sửa gì, hoá đơn, bảo hành còn bao lâu và khi nào bảo dưỡng tiếp. Không cần tài khoản.";

export const metadata = {
  title: "Tra cứu lịch sử xe, bảo hành theo biển số",
  description: MO_TA,
  alternates: { canonical: "/tra-cuu-xe/" },
  openGraph: { title: "Tra cứu lịch sử xe – ThợTới", description: MO_TA, url: "/tra-cuu-xe/" },
};

export default async function TrangTraCuuXe() {
  const chung = await layChung();
  return (
    <>
      <DuongDan cap={[{ ten: "Tra cứu lịch sử xe", href: "/tra-cuu-xe/" }]} an />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebPage", name: "Tra cứu lịch sử xe", description: MO_TA,
        url: `${site.url}/tra-cuu-xe/`, isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
        provider: { "@type": "AutoRepair", name: chung.thuongHieu?.ten || site.name, telephone: chung.lienHe.hotline || undefined },
      }} />
      <TraCuuXe hotline={chung.lienHe.hotline} camKet={chung.camKet} />
    </>
  );
}
