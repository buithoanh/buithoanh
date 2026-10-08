// Bảng giá công khai (thiết kế BangGia). Server render sẵn phân khúc mặc định (hoặc ?phanKhuc=A–D), đổi phân khúc ở trình duyệt.
import Link from "next/link";
import site from "@/site.config.mjs";
import { formatDate, layPayload } from "@/lib/cms";
import { layBangGia } from "@/lib/cong-khai";
import { layTrangHoiVien } from "@/lib/hoi-vien";
import { layChung, tenKhuVuc } from "@/lib/giao-dien";
import JsonLd from "@/components/JsonLd";
import DuongDan from "@/components/chung/DuongDan";
import Hero from "@/components/trang/Hero";
import KhoiCta from "@/components/trang/KhoiCta";
import { tomTatGoi } from "@/components/trang/goi";
import BangGiaDayDu from "@/components/trang/BangGiaDayDu";
import s from "./bang-gia.module.css";

const PK = ["A", "B", "C", "D"];
const MAC_DINH = "B";

export const metadata = {
  title: "Bảng giá sửa ô tô tận nơi công khai",
  description: `Giá công cố định, giá phụ tùng theo cỡ xe A–D cho bảo dưỡng, ắc quy, lốp, phanh, đọc lỗi, cứu hộ tại ${site.city}. Thợ báo giá từng món, đồng ý mới làm.`,
  alternates: { canonical: "/bang-gia/" },
};

export default async function TrangBangGia({ searchParams }) {
  const { phanKhuc: q } = await searchParams;
  const pk = PK.includes(String(q || "").toUpperCase()) ? String(q).toUpperCase() : MAC_DINH;
  const payload = await layPayload();
  const [bg, hv, chung] = await Promise.all([layBangGia(payload, pk), layTrangHoiVien(payload), layChung()]);
  const capNhat = bg.capNhatLuc ? formatDate(bg.capNhatLuc) : null;
  const khuVuc = tenKhuVuc(chung);

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "OfferCatalog", name: `Bảng giá ${site.name}`, url: `${site.url}/bang-gia/`,
        itemListElement: bg.dichVu.map((d) => ({
          "@type": "OfferCatalog", name: d.ten,
          itemListElement: d.hangMuc.filter((h) => h.loai === "cong").map((h) => ({
            "@type": "Offer", name: h.ten, priceCurrency: "VND", price: h.gia.tu, itemOffered: { "@type": "Service", name: h.ten },
          })),
        })),
      }} />
      <Hero
        duongDan={<DuongDan toi cap={[{ ten: "Bảng giá", href: "/bang-gia/" }]} />}
        tieuDe="Bảng giá công khai"
        moTa="Tiền công cố định, phụ tùng có khoảng giá theo cỡ xe. Thợ báo giá từng món, bạn đồng ý mới làm."
      >
        {capNhat ? (
          <span className={s.capNhat}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            Cập nhật ngày {capNhat}
          </span>
        ) : null}
      </Hero>

      <div className="wrap">
        <BangGiaDayDu phanKhuc={bg.phanKhuc} phanKhucBanDau={pk} dichVu={bg.dichVu} />

        <section className="khoi" aria-labelledby="phi-chung">
          <h2 id="phi-chung" className={s.h2}>Phí đi lại và phí kiểm tra</h2>
          <div className={s.phi}>
            <div>
              <span><b>Phí đi lại</b><span>{khuVuc.length ? `Trong vùng phục vụ: ${khuVuc.join(", ")}.` : "Trong vùng phục vụ."} Ngoài vùng: cố vấn báo giá.</span></span>
              <b>{bg.phi.hienThi.phiDiLai}</b>
            </div>
            <div>
              <span><b>Phí kiểm tra khi không sửa</b><span>Thợ tới kiểm tra, gửi báo giá chính thức. Nếu bạn chưa muốn sửa và từ chối báo giá, đơn kết thúc và bạn chỉ trả phí kiểm tra này.</span></span>
              <b>{bg.phi.hienThi.phiKiemTra}</b>
            </div>
          </div>
          {bg.baoHanh.phuTungThang || bg.baoHanh.congThang ? (
            <div className={s.baoHanh}>
              {bg.baoHanh.phuTungThang ? <div><b>{bg.baoHanh.phuTungThang} tháng</b><span>bảo hành phụ tùng</span></div> : null}
              {bg.baoHanh.congThang ? <div><b>{bg.baoHanh.congThang} tháng</b><span>bảo hành tiền công</span></div> : null}
            </div>
          ) : null}
        </section>

        {hv.goi.length ? (
          <section className="khoi" aria-labelledby="goi-hv">
            <div className="khoi-tieu-de">
              <h2 id="goi-hv" className={s.h2}>Gói hội viên</h2>
              <Link href="/hoi-vien/" className="link-nhan nho">So sánh gói →</Link>
            </div>
            <ul className={s.goi}>
              {hv.goi.map((g, i) => (
                <li key={g.slug}>
                  <Link href="/hoi-vien/" className={`${s.theGoi} ${i === hv.goi.length - 1 && hv.goi.length > 1 ? s.noiBat : ""}`}>
                    <b className={s.tenGoi}>{g.ten}</b>
                    <span><b className={s.giaGoi}>{g.giaNamHienThi}</b><span className="phu nho">/năm</span></span>
                    <span className={s.tomGoi}>{tomTatGoi(g.quyenLoi)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className={s.luuY} aria-labelledby="luu-y">
          <h2 id="luu-y">Giá trên đây để bạn tham khảo trước</h2>
          <ul>
            <li>Giá chính thức chốt sau khi thợ kiểm tra xe.</li>
            <li>Thợ gửi báo giá từng món qua Zalo, bạn bỏ bớt món chưa cần cũng được.</li>
            <li>Giá phụ tùng đổi theo hãng, đời xe và hàng chính hãng hay tương đương.</li>
            <li>Sửa xong có hoá đơn điện tử gửi qua Zalo.</li>
          </ul>
          <span className="phu nho">{capNhat ? `Cập nhật ngày ${capNhat} · ` : ""}Mọi trang trên website dùng chung bảng giá này.</span>
        </section>

        <KhoiCta
          tieuDe="Muốn biết giá sát cho xe mình?" moTa="Chọn hãng, dòng, đời xe, giá sơ bộ hiện ngay khi đặt lịch."
          href="/dat-lich/" chuNut="Xem giá cho xe của tôi"
        />
      </div>
    </>
  );
}
