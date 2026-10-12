// Doanh nghiệp có đội xe (thiết kế DoanhNghiep): gói hợp đồng theo loại đội xe, giấy tờ, form xin báo giá (tra MST tự điền).
// Bảng "giá theo xe mỗi tháng" và mức giảm theo số xe trong thiết kế là giá mẫu, chưa thành dữ liệu (BAN-GIAO-BE mục 23):
// trang chỉ liệt kê loại xe nhận hợp đồng và mời gửi yêu cầu để nhận báo giá, không in giá.
import { layPayload } from "@/lib/cms";
import { layChung, tenKhuVuc } from "@/lib/giao-dien";
import { layTrangDoanhNghiep } from "@/lib/p2";
import DuongDan from "@/components/chung/DuongDan";
import JsonLd from "@/components/JsonLd";
import Icon from "@/components/Icon";
import TabDoiXe from "@/components/p2/TabDoiXe";
import FormDoanhNghiep from "@/components/p2/FormDoanhNghiep";
import site from "@/site.config.mjs";
import s from "./doanh-nghiep.module.css";

export async function generateMetadata() {
  const chung = await layChung();
  const ten = chung.thuongHieu?.ten || site.name;
  return {
    title: "Bảo dưỡng đội xe doanh nghiệp tại bãi",
    description: `${ten} cho doanh nghiệp có đội xe: thợ tới bãi bảo dưỡng ngoài giờ chạy, cứu hộ ưu tiên, một hợp đồng, hoá đơn VAT điện tử. Gửi yêu cầu để nhận báo giá.`,
    alternates: { canonical: "/doanh-nghiep/" },
  };
}

export default async function TrangDoanhNghiep() {
  const [chung, d] = await Promise.all([layChung(), layPayload().then(layTrangDoanhNghiep)]);
  const ten = chung.thuongHieu?.ten || site.name;
  const ck = chung.camKet || {};
  const cuuHo = ck.cuuHoPhut ? `${ck.cuuHoPhut} phút` : null;
  const khuVuc = tenKhuVuc(chung);

  const doiXe = [
    {
      id: "taxi", tab: "Taxi", tieuDe: "Gói Taxi – chạy liên tục", phu: "Taxi xăng và taxi điện, chạy 2 ca mỗi ngày",
      y: [
        "Bảo dưỡng theo km, thợ tới bãi lúc đổi ca, xe không mất ca chạy",
        `Ưu tiên cứu hộ${cuuHo ? ` trong ${cuuHo}` : ""}: ắc quy, lốp, không nổ máy`,
        "Làm được taxi điện: lốp, phanh, ắc quy 12V, điều hoà",
        "Báo cáo tình trạng từng xe theo biển số mỗi tháng",
      ],
      ghiChu: "Phù hợp đội từ 10 xe trở lên, bãi trong vùng phục vụ.",
    },
    {
      id: "thue", tab: "Cho thuê tự lái", tieuDe: "Gói Cho thuê tự lái", phu: "Xe quay vòng nhanh giữa các khách thuê",
      y: [
        "Kiểm tra nhanh giữa 2 lượt thuê, có ảnh gửi qua Zalo",
        "Thay dầu, lọc, má phanh ngay tại bãi giao xe",
        "Cứu hộ cho khách thuê khi xe gặp sự cố trong vùng phục vụ",
        "Ghi chép hồ sơ từng xe để đối chiếu khi khách trả xe",
      ],
      ghiChu: "Phù hợp đội từ 5 xe, nhiều hãng và đời xe khác nhau.",
    },
    {
      id: "cty", tab: "Xe công ty", tieuDe: "Gói Xe công ty", phu: "Xe đưa đón, xe lãnh đạo, xe kinh doanh",
      y: [
        "Lên lịch bảo dưỡng cả năm, nhắc trước 1 tuần qua Zalo",
        "Thợ làm tại hầm toà nhà hoặc bãi công ty, ngoài giờ hành chính",
        "Một hoá đơn VAT gộp mỗi tháng, chia chi phí theo từng xe",
        "Một đầu mối phụ trách, gọi là có người nghe",
      ],
      ghiChu: "Phù hợp đội từ 3 xe, cần thủ tục và chứng từ rõ ràng.",
    },
  ];

  const giayTo = [
    { icon: "receipt", t: "Hoá đơn VAT điện tử", d: "Xuất theo tháng, gửi qua email kế toán. Tách chi phí theo biển số." },
    { icon: "tai-lieu", t: "Hợp đồng và biên bản nghiệm thu", d: "Mỗi lần làm có biên bản kèm ảnh trước và sau khi sửa." },
    {
      icon: "shield", t: "Bảo hành rõ ràng",
      d: ck.baoHanhPhuTungThang
        ? `Phụ tùng bảo hành ${ck.baoHanhPhuTungThang} tháng${ck.baoHanhCongThang ? `, tiền công bảo hành ${ck.baoHanhCongThang} tháng` : ""}.`
        : "Bảo hành phụ tùng và tiền công theo chính sách bảo hành.",
    },
  ];

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Service", name: "Bảo dưỡng, sửa chữa đội xe doanh nghiệp tại bãi",
        serviceType: "Bảo dưỡng đội xe theo hợp đồng", url: `${site.url}/doanh-nghiep/`,
        provider: { "@type": "AutoRepair", name: ten, url: site.url, ...(chung.lienHe?.hotline ? { telephone: chung.lienHe.hotline } : {}) },
        areaServed: khuVuc.length ? khuVuc : undefined,
        audience: { "@type": "BusinessAudience", name: "Doanh nghiệp có đội xe" },
      }} />

      <section className={s.hero}>
        <div className={`wrap ${s.heroTrong}`}>
          <DuongDan cap={[{ ten: "Doanh nghiệp", href: "/doanh-nghiep/" }]} toi />
          <span className={s.nhanHero}>Dành cho doanh nghiệp có đội xe</span>
          <h1>Xe nằm bãi,<br />thợ tới bảo dưỡng</h1>
          <p className={s.dan}>Không phải điều tài xế ra gara, xe không nghỉ chạy nửa ngày. Một hợp đồng, giá theo xe mỗi tháng, hoá đơn VAT đầy đủ.</p>
          <div className={s.nutHero}>
            <a href="#bao-gia" className="nut nut-chinh nut-lon">Xin báo giá hợp đồng</a>
            {d.hoSoNangLuc ? (
              <a href={d.hoSoNangLuc} className="nut nut-vien-trang" target="_blank" rel="noopener"><Icon name="tai-xuong" /> Tải hồ sơ năng lực (PDF)</a>
            ) : null}
          </div>
          <div className={s.diem}>
            <div><b>Tại bãi</b><span>làm ngoài giờ chạy</span></div>
            <div><b>{cuuHo || "Ưu tiên"}</b><span>cứu hộ ưu tiên</span></div>
            <div><b>VAT</b><span>hoá đơn điện tử</span></div>
          </div>
        </div>
      </section>

      <div className={`wrap ${s.luoi}`}>
        <div className={s.cotTrai}>
          <section className={s.khoi} aria-labelledby="tieu-de-goi">
            <div>
              <h2 id="tieu-de-goi">Gói hợp đồng theo loại đội xe</h2>
              <p className="phu">Chọn loại xe của bạn để xem gói phù hợp.</p>
            </div>
            <TabDoiXe ds={doiXe} />
          </section>

          <section className={s.khoi} aria-labelledby="tieu-de-gia">
            <div>
              <h2 id="tieu-de-gia">Giá theo xe mỗi tháng</h2>
              <p className="phu">Giá tính theo số xe, loại xe và lịch bảo dưỡng của đội. Sales gửi báo giá chi tiết, chốt trong hợp đồng.</p>
            </div>
            <div className={`the ${s.bangGia}`}>
              <div className={s.dauBang}><span>Loại xe</span><span>Đồng/xe/tháng</span></div>
              {d.luaChon.loaiXe.filter((x) => x.value !== "nhieu-loai").map((x) => (
                <div key={x.value} className={s.dongGia}>
                  <span>{x.label}</span>
                  <a href="#bao-gia" className={s.lienHe}>Nhận báo giá</a>
                </div>
              ))}
              <div className={s.daGom}>
                <b>Giá đã gồm</b>
                <span>Tiền công bảo dưỡng định kỳ, kiểm tra định kỳ tại bãi, miễn phí đi lại{cuuHo ? `, ưu tiên cứu hộ trong ${cuuHo}` : ", ưu tiên cứu hộ"}. Phụ tùng tính theo <a href="/bang-gia/">bảng giá công khai</a>.</span>
              </div>
            </div>
            <p className={s.giam}><Icon name="check" size={18} /> Đội xe càng đông, giá mỗi xe càng giảm. Mức giảm ghi rõ trong báo giá.</p>
          </section>

          <section className={s.khoi} aria-labelledby="tieu-de-giay-to">
            <h2 id="tieu-de-giay-to">Hoá đơn, giấy tờ rõ ràng</h2>
            <ul className={s.giayTo}>
              {giayTo.map((g) => (
                <li key={g.t} className="the">
                  <span className={s.oIcon} aria-hidden="true"><Icon name={g.icon} size={20} /></span>
                  <div><b>{g.t}</b><span>{g.d}</span></div>
                </li>
              ))}
            </ul>
            {d.hoSoNangLuc ? (
              <a href={d.hoSoNangLuc} className={s.hoSo} target="_blank" rel="noopener">
                <span className={s.oIconToi} aria-hidden="true"><Icon name="tai-lieu" size={22} /></span>
                <span><b>Tải hồ sơ năng lực</b><span>Tệp PDF, mở trong tab mới</span></span>
                <Icon name="tai-xuong" size={20} />
              </a>
            ) : null}
          </section>
        </div>

        <section id="bao-gia" className={`${s.khoi} ${s.cotForm}`} aria-label="Xin báo giá hợp đồng">
          <FormDoanhNghiep luaChon={d.luaChon} chinhSach={chung.lienHe?.chinhSachDuLieu} hoSoNangLuc={d.hoSoNangLuc} />
          {d.camKet ? <p className="phu nho">{d.camKet}</p> : null}
        </section>
      </div>
    </>
  );
}
