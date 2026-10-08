// Màn BaoGia: khách duyệt báo giá chính thức theo link riêng /don/<token>/bao-gia/.
import { xemBaoGia } from "@/lib/don/phuc-vu";
import { donTheoToken } from "@/lib/don/theo-doi";
import { layChung } from "@/lib/giao-dien";
import BaoGiaDon from "@/components/phuc-vu/BaoGiaDon";
import LoiLink from "@/components/phuc-vu/LoiLink";
import { khongIndex, thu } from "@/components/phuc-vu/may-chu";

export const metadata = {
  title: "Duyệt báo giá",
  description: "Báo giá chính thức của thợ: chọn hạng mục muốn làm rồi bấm đồng ý.",
  robots: khongIndex,
};

export default async function TrangBaoGia({ params }) {
  const { token } = await params;
  const [kq, don, chung] = await Promise.all([
    thu((p) => xemBaoGia(p, token)),
    thu((p) => donTheoToken(p, token)),
    layChung(),
  ]);
  const hotline = chung.lienHe.hotline;
  if (don.loi) return <LoiLink status={don.loi.status} hotline={hotline} />;
  if (kq.loi) {
    return (
      <LoiLink
        status={409} hotline={hotline} dauDe={`Báo giá đơn ${don.duLieu.ma}`}
        tieuDe="Thợ chưa gửi báo giá"
        loi="Thợ kiểm tra xe xong sẽ gửi báo giá chính thức qua Zalo. Bạn duyệt xong thợ mới làm."
        quayLai={`/don/${token}/`}
      />
    );
  }
  return <BaoGiaDon token={token} banDau={kq.duLieu} sdt={don.duLieu.khach?.sdt} hotline={hotline} trangThaiDon={don.duLieu.trangThai} />;
}
