// Màn ThanhToan: VietQR, chuyển khoản tay, biên nhận, hoá đơn, bảo hành theo link riêng /don/<token>/thanh-toan/.
import { xemThanhToan } from "@/lib/don/phuc-vu";
import { layChung } from "@/lib/giao-dien";
import ThanhToanDon from "@/components/phuc-vu/ThanhToanDon";
import LoiLink from "@/components/phuc-vu/LoiLink";
import { khongIndex, thu } from "@/components/phuc-vu/may-chu";

export const metadata = {
  title: "Thanh toán đơn",
  description: "Chuyển khoản VietQR cho đơn sửa xe, biên nhận, hoá đơn điện tử và phiếu bảo hành.",
  robots: khongIndex,
};

export default async function TrangThanhToan({ params }) {
  const { token } = await params;
  const [kq, chung] = await Promise.all([thu((p) => xemThanhToan(p, token)), layChung()]);
  const hotline = chung.lienHe.hotline;
  if (kq.loi) {
    if (kq.loi.status === 404 || kq.loi.status === 410) return <LoiLink status={kq.loi.status} hotline={hotline} />;
    return (
      <LoiLink
        status={409} hotline={hotline} dauDe="Thanh toán đơn"
        tieuDe="Chưa tới bước thanh toán"
        loi="Thợ sửa xong sẽ báo số tiền, khi đó trang này hiện mã VietQR để bạn chuyển khoản."
        quayLai={`/don/${token}/`}
      />
    );
  }
  return <ThanhToanDon token={token} banDau={kq.duLieu} camKet={chung.camKet} />;
}
