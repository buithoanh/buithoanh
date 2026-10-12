// Màn DanhGia: link riêng /don/<tokenDanhGia>/danh-gia/ (token đánh giá khác token theo dõi), dùng một lần.
import { xemDanhGia } from "@/lib/don/danh-gia";
import { layChung } from "@/lib/giao-dien";
import DanhGiaDon from "@/components/phuc-vu/DanhGiaDon";
import LoiLink from "@/components/phuc-vu/LoiLink";
import { khongIndex, thu } from "@/components/phuc-vu/may-chu";

export const metadata = {
  title: "Đánh giá lần sửa xe",
  description: "Chấm điểm thợ và góp ý cho ThợTới. Link riêng, dùng một lần.",
  robots: khongIndex,
};

export default async function TrangDanhGia({ params }) {
  const { token } = await params;
  const [kq, chung] = await Promise.all([thu((p) => xemDanhGia(p, token)), layChung()]);
  if (kq.loi) {
    return (
      <LoiLink
        status={kq.loi.status === 410 ? 410 : 404} hotline={chung.lienHe.hotline}
        tieuDe="Link đánh giá không đúng"
        loi="Không tìm thấy đơn theo link đánh giá này. Bạn kiểm tra lại link trong tin Zalo/SMS, hoặc gọi tổng đài để góp ý trực tiếp."
      />
    );
  }
  return <DanhGiaDon token={token} banDau={kq.duLieu} linkGoogleMacDinh={chung.google?.linkDanhGia} />;
}
