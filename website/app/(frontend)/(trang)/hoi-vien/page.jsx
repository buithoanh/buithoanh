// Hội viên (thiết kế HoiVien): 2 gói năm, bảng so sánh, đăng ký mua gói, giới thiệu bạn bè (nhận mã qua Zalo).
// Số liệu gói, quyền lợi, thưởng giới thiệu lấy từ layTrangHoiVien() (lib/hoi-vien.ts) — không gõ cứng giá.
// Mã của từng khách xem ở link riêng /gioi-thieu/<token>/ gửi qua Zalo (không hiện trên trang này để không ai dò được số người khác).
import Link from "next/link";
import { layPayload } from "@/lib/cms";
import { layChung } from "@/lib/giao-dien";
import { layTrangHoiVien } from "@/lib/hoi-vien";
import DuongDan from "@/components/chung/DuongDan";
import JsonLd from "@/components/JsonLd";
import GoiHoiVien from "@/components/p2/GoiHoiVien";
import NhanMaGioiThieu from "@/components/p2/NhanMaGioiThieu";
import { BuocSo, HoiDap, TheThuong } from "@/components/p2/KhoiP2";
import site from "@/site.config.mjs";
import s from "./hoi-vien.module.css";

export async function generateMetadata() {
  const [chung, d] = await Promise.all([layChung(), layPayload().then(layTrangHoiVien)]);
  const ten = chung.thuongHieu?.ten || site.name;
  const tu = d.goi[0]?.giaNamHienThi;
  return {
    title: `Hội viên ${ten}: gói năm sửa xe tận nơi`,
    description: `Gói hội viên ${ten}${tu ? ` từ ${tu}/năm` : ""}: miễn phí đi lại, giảm tiền công, ưu tiên khi gọi gấp. Giới thiệu bạn bè nhận thêm lượt miễn phí.`,
    alternates: { canonical: "/hoi-vien/" },
  };
}

export default async function TrangHoiVien() {
  const [chung, d] = await Promise.all([layChung(), layPayload().then(layTrangHoiVien)]);
  const ten = chung.thuongHieu?.ten || site.name;
  const hotline = chung.lienHe?.hotline || d.hotline;
  const tt = d.gioiThieu;

  const hoiDap = [
    { hoi: "Gói hội viên dùng cho mấy xe?", dap: <>Mỗi gói gắn với 1 biển số. Nhà có 2 xe thì đăng ký 2 gói. Doanh nghiệp có đội xe xem <Link href="/doanh-nghiep/">gói hợp đồng riêng</Link>.</>, chu: "Mỗi gói gắn với 1 biển số. Nhà có 2 xe thì đăng ký 2 gói. Doanh nghiệp có đội xe xem gói hợp đồng riêng." },
    { hoi: "Giảm tiền công có tính cả phụ tùng không?", chu: "Chỉ giảm tiền công. Phụ tùng tính theo giá trong báo giá chính thức, thợ kiểm tra xe xong mới chốt. Giảm của gói không cộng dồn với mã khuyến mãi: hệ thống lấy mức có lợi hơn cho bạn." },
    { hoi: "Bạn bè dùng mã của tôi thế nào?", chu: "Bạn bè mở link giới thiệu của bạn (có ?ma=MÃ_CỦA_BẠN), mã tự điền vào ô \"Mã giới thiệu\" khi đặt lịch. Gõ tay mã vào ô đó cũng được." },
    { hoi: "Khi nào tôi nhận được lượt miễn phí?", chu: `Khi đơn của bạn bè sửa xong và đã thanh toán, hoặc bạn bè mua gói hội viên. ${ten} nhắn Zalo báo bạn, lượt miễn phí tự trừ vào đơn kế tiếp.` },
    { hoi: "Muốn huỷ gói thì sao?", chu: `${hotline ? `Gọi ${hotline}, c` : "Liên hệ c"}ố vấn kiểm tra quyền lợi đã dùng và hướng dẫn huỷ theo chính sách hội viên.` },
  ];

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Service", name: `Hội viên ${ten}`, serviceType: "Gói bảo dưỡng, sửa ô tô tận nơi theo năm",
        provider: { "@type": "AutoRepair", name: ten, url: site.url, ...(hotline ? { telephone: hotline } : {}) },
        areaServed: chung.vungPhucVu?.quan?.map((q) => q.ten) || undefined,
        offers: d.goi.map((g) => ({ "@type": "Offer", name: g.ten, price: g.giaNam, priceCurrency: "VND", url: `${site.url}/hoi-vien/` })),
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: hoiDap.map((q) => ({ "@type": "Question", name: q.hoi, acceptedAnswer: { "@type": "Answer", text: q.chu } })),
      }} />

      <section className={s.hero}>
        <div className={`wrap ${s.heroTrong}`}>
          <DuongDan cap={[{ ten: "Hội viên", href: "/hoi-vien/" }]} toi />
          <h1>Hội viên {ten}</h1>
          <p className={s.dan}>Trả một lần mỗi năm, gọi thợ không lo phí đi lại, được giảm tiền công. Giới thiệu bạn bè còn được thêm lượt miễn phí.</p>
          <div className={s.nutHero}>
            <a href="#goi" className="nut nut-chinh">Xem {d.goi.length} gói</a>
            <a href="#ma" className="nut nut-vien-trang">Mã giới thiệu</a>
          </div>
        </div>
      </section>

      <div className={`wrap ${s.luoi}`}>
        <section id="goi" className={s.khoi} aria-labelledby="tieu-de-goi">
          <div>
            <h2 id="tieu-de-goi">Chọn gói hợp với bạn</h2>
            <p className="phu">Chạm vào gói để chọn, bảng so sánh bên dưới.</p>
          </div>
          {d.goi.length ? (
            <GoiHoiVien goi={d.goi} bangSoSanh={d.bangSoSanh} thoiHanThang={d.thoiHanThang} hotline={hotline} chinhSach={chung.lienHe?.chinhSachDuLieu} />
          ) : (
            <p className="bao bao-vang">Gói hội viên đang được cập nhật. {hotline ? `Gọi ${hotline} để được tư vấn.` : ""}</p>
          )}
        </section>

        <div className={s.cotPhai}>
          <section id="ma" className={s.khoi} aria-labelledby="tieu-de-ma">
            <div>
              <h2 id="tieu-de-ma">Giới thiệu bạn bè</h2>
              <p className="phu">Mỗi khách có một mã riêng. Bạn bè đặt qua link của bạn, mã tự gắn vào đơn.</p>
            </div>
            <NhanMaGioiThieu />
          </section>

          <section className={s.khoi} aria-labelledby="tieu-de-thuong">
            <h2 id="tieu-de-thuong">Nhận thưởng thế nào</h2>
            <BuocSo buoc={[
              { t: "Gửi mã hoặc link cho bạn bè", d: "Bấm Chia sẻ qua Zalo trong trang mã của bạn, hoặc chép link giới thiệu." },
              { t: "Bạn bè đặt lịch qua link", d: "Mã tự gắn vào đơn, bạn bè không cần nhớ hay gõ lại." },
              { t: "Đơn sửa xong, thanh toán", d: "Bạn bè được miễn phí đi lại ngay trong đơn đầu." },
              { t: "Bạn nhận lượt miễn phí", d: `${ten} nhắn Zalo báo, lượt tự trừ vào lần gọi thợ sau.` },
            ]} />
            <TheThuong thuong={tt} />
          </section>
        </div>
      </div>

      <div className="wrap-hep">
        <section className={s.khoi} aria-labelledby="tieu-de-hoi-dap">
          <h2 id="tieu-de-hoi-dap">Câu hỏi thường gặp</h2>
          <HoiDap ds={hoiDap} />
          <Link href="/bang-gia/" className={`link-nhan ${s.xemBangGia}`}>Xem bảng giá đầy đủ →</Link>
        </section>
      </div>
    </>
  );
}
