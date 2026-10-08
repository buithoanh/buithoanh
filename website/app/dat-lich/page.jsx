import site from "../../site.config.mjs";
import { allEntries } from "../../lib/content.mjs";
import BookingForm from "./BookingForm";

export const metadata = { title: "Đặt lịch thợ tới tận nơi", description: `Đặt lịch bảo dưỡng, thay ắc quy, lốp, phanh tận nơi tại ${site.city}. Báo giá trước khi làm.`, alternates: { canonical: "/dat-lich/" } };

export default function BookingPage() {
  const services = allEntries("dich-vu").sort((a, b) => (a.data.thuTu ?? 99) - (b.data.thuTu ?? 99)).map((s) => s.data.ten);
  return (
    <section className="block">
      <div className="wrap">
        <div className="prose">
          <h1>Đặt lịch thợ tới tận nơi</h1>
          <p>Điền 4 thông tin, nhân viên gọi lại báo giá. Xe đang hỏng giữa đường thì gọi hotline sẽ nhanh hơn.</p>
          <BookingForm services={services} endpoint={site.bookingEndpoint} hotline={site.hotline} zalo={site.zalo} />
        </div>
      </div>
    </section>
  );
}
