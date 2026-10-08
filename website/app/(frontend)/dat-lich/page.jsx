import site from "../../../site.config.mjs";
import { layDanhSachDichVu, laySite } from "../../../lib/cms";
import BookingForm from "./BookingForm";

export const metadata = { title: "Đặt lịch thợ tới tận nơi", description: `Đặt lịch bảo dưỡng, thay ắc quy, lốp, phanh tận nơi tại ${site.city}. Báo giá trước khi làm.`, alternates: { canonical: "/dat-lich/" } };

export default async function BookingPage() {
  const [s, dichVu] = await Promise.all([laySite(), layDanhSachDichVu()]);
  return (
    <section className="block">
      <div className="wrap">
        <div className="prose">
          <h1>Đặt lịch thợ tới tận nơi</h1>
          <p>Điền 4 thông tin, nhân viên gọi lại báo giá. Xe đang hỏng giữa đường thì gọi hotline sẽ nhanh hơn.</p>
          <BookingForm services={dichVu.map((d) => d.ten)} endpoint={s.bookingEndpoint} hotline={s.hotline} zalo={s.zalo} />
        </div>
      </div>
    </section>
  );
}
