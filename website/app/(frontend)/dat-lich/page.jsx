import Link from "next/link";
import site from "../../../site.config.mjs";
import { layPayload, laySite } from "../../../lib/cms";
import { layTrangDatLich } from "../../../lib/cong-khai";
import { CallButton, ZaloButton } from "../../../components/Contact";
import BookingForm from "./BookingForm";

export const metadata = { title: "Đặt lịch thợ tới tận nơi", description: `Đặt lịch bảo dưỡng, thay ắc quy, lốp, phanh tận nơi tại ${site.city}. Báo giá trước khi làm.`, alternates: { canonical: "/dat-lich/" } };

export default async function BookingPage() {
  const [s, duLieu] = await Promise.all([laySite(), layPayload().then(layTrangDatLich)]);
  return (
    <>
      <section className="page-hero page-hero-compact">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Trang chủ</Link> / <span aria-current="page">Đặt lịch</span></nav>
          <h1>Đặt lịch thợ tới tận nơi</h1>
          <p className="lead">Điền 4 thông tin, nhân viên gọi lại báo giá. Xe đang hỏng giữa đường thì gọi hotline sẽ nhanh hơn.</p>
        </div>
      </section>
      <div className="wrap page-body">
        <div className="form-card">
          <BookingForm duLieu={duLieu} endpoint={site.bookingEndpoint} hotline={s.hotline} />
        </div>
        <aside className="side" aria-label="Cần thợ gấp">
          <div className="side-card side-call">
            <p className="side-title">Xe đang hỏng giữa đường?</p>
            <p>Đừng chờ đặt lịch. Gọi thẳng để thợ tới sớm nhất.</p>
            <CallButton hotline={s.hotline} className="btn btn-primary btn-block" />
            <ZaloButton zalo={s.zalo} className="btn btn-zalo btn-block" />
          </div>
          <div className="side-card">
            <p className="side-title">Sau khi gửi lịch</p>
            <ol className="mini-steps">
              <li>Nhân viên gọi lại xác nhận giờ.</li>
              <li>Thợ báo giá công và phụ tùng trước.</li>
              <li>Bạn đồng ý, thợ tới nơi xe đỗ.</li>
            </ol>
          </div>
        </aside>
      </div>
    </>
  );
}
