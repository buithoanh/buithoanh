import site from "../../site.config.mjs";
import { telHref } from "../../components/Contact";
import TrackForm from "./TrackForm";

export const metadata = {
  title: "Tra cứu lệnh sửa chữa",
  description: `Xem lệnh sửa chữa của bạn đang ở bước nào: tiếp nhận, thợ đang tới, đang sửa, hoàn tất, thanh toán. ${site.name}.`,
  alternates: { canonical: "/tra-cuu/" },
};

export default function TrackPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Tra cứu</p>
          <h1>Lệnh sửa chữa của bạn đang ở đâu?</h1>
          <p className="lead">Nhập số điện thoại và mã lệnh (gửi qua SMS hoặc Zalo khi tiếp nhận) để xem ai đang tới và xe đang ở bước nào.</p>
        </div>
      </section>
      <section className="block">
        <div className="wrap">
          <TrackForm endpoint={site.trackingEndpoint} mock={site.mock} hotline={site.hotline} telHref={telHref()} />
        </div>
      </section>
    </>
  );
}
