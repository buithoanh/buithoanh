// Màn báo gọn khi link riêng hết hạn (410) hoặc sai (404), hay chưa tới bước (chưa có báo giá, chưa tính tiền).
// Luôn kèm hotline và gợi ý tra cứu xe bằng biển số.
import Link from "next/link";
import DauDon from "@/components/chung/DauDon";
import Icon from "@/components/Icon";
import { telHref } from "./dinh-dang";
import s from "./phuc-vu.module.css";
import l from "./LoiLink.module.css";

const NOI_DUNG = {
  410: {
    tieuDe: "Link đã hết hạn",
    loi: "Link riêng của đơn chỉ dùng được trong 24 giờ sau khi đơn xong. Hoá đơn, bảo hành và các lần sửa vẫn xem lại được bằng biển số xe.",
  },
  404: {
    tieuDe: "Link không đúng",
    loi: "Không tìm thấy đơn theo link này. Bạn kiểm tra lại link trong tin Zalo/SMS, hoặc gọi tổng đài để được hỗ trợ.",
  },
};

export default function LoiLink({ status = 404, tieuDe, loi, hotline, quayLai, tenQuayLai = "Xem trạng thái đơn", dauDe = "ThợTới", dauPhu }) {
  const nd = NOI_DUNG[status === 410 ? 410 : 404];
  const laLink = status === 410 || status === 404;
  return (
    <>
      <DauDon tieuDe={dauDe} phu={dauPhu} />
      <section className={l.khung}>
        <span className={status === 410 ? l.bieuTuongVang : l.bieuTuong} aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {status === 410
              ? <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>
              : <><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16.5v.5" /></>}
          </svg>
        </span>
        <h1>{tieuDe || nd.tieuDe}</h1>
        <p>{loi || nd.loi}</p>
        <div className={l.nut}>
          {quayLai ? <Link className="nut nut-toi nut-day" href={quayLai}>{tenQuayLai}</Link> : null}
          {laLink ? <Link className={`${s.nutVien}`} href="/tra-cuu-xe/">Tra cứu lịch sử xe bằng biển số</Link> : null}
          {hotline ? <a className="nut nut-chinh nut-day" href={telHref(hotline)}><Icon name="phone" /> Gọi {hotline}</a> : null}
          <Link className={s.nutChu} href="/">Về trang chủ ThợTới</Link>
        </div>
      </section>
    </>
  );
}
