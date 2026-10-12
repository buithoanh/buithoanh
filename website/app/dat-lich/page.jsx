import site from "../../site.config.mjs";
import { sortedServices } from "../../lib/content.mjs";
import { CallButton, Commitments, telHref } from "../../components/Contact";
import Icon from "../../components/Icon";
import BookingForm from "./BookingForm";

export const metadata = { title: "Đặt lịch thợ tới tận nơi", description: `Đặt lịch bảo dưỡng, thay ắc quy, lốp, phanh tận nơi tại ${site.city}. Báo giá trước khi làm.`, alternates: { canonical: "/dat-lich/" } };

export default function BookingPage() {
  const services = sortedServices().map((s) => ({ slug: s.slug, ten: s.data.ten, icon: s.data.icon }));
  return (
    <section className="block bk-page">
      <div className="wrap bk-grid">
        <div className="bk-h1"><h1>Đặt lịch thợ tới tận nơi</h1><p>3 bước ngắn. Nhân viên gọi lại báo giá trước khi làm.</p></div>
        <div className="card-lg">
          <BookingForm services={services} endpoint={site.bookingEndpoint} mock={site.mock} hotline={site.hotline} telHref={telHref()} zalo={site.zalo} />
        </div>
        <div className="bk-aside">
          <div className="urgent">
            <span className="urgent-ic"><Icon name="alert" size={22} /></span>
            <div>
              <b>Xe hỏng giữa đường?</b>
              <p>Gọi hotline sẽ nhanh hơn đặt lịch. Tổng đài hỏi vị trí và báo giá ngay.</p>
              <CallButton />
            </div>
          </div>
          <Commitments variant="list" />
        </div>
      </div>
    </section>
  );
}
