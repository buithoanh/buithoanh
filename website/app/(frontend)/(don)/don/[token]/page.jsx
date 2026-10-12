// Màn TheoDoi: link riêng của khách /don/<token>/. Render phía server lần đầu (gọi thẳng lib), sau đó tự hỏi lại.
import { donTheoToken } from "@/lib/don/theo-doi";
import { layChung } from "@/lib/giao-dien";
import TheoDoiDon from "@/components/phuc-vu/TheoDoiDon";
import LoiLink from "@/components/phuc-vu/LoiLink";
import { khongIndex, thu } from "@/components/phuc-vu/may-chu";

export const metadata = {
  title: "Theo dõi đơn",
  description: "Trạng thái đơn sửa xe, thợ và giờ đến. Link riêng của khách.",
  robots: khongIndex,
};

export default async function TrangTheoDoi({ params }) {
  const { token } = await params;
  const [kq, chung] = await Promise.all([thu((p) => donTheoToken(p, token)), layChung()]);
  if (kq.loi) return <LoiLink status={kq.loi.status} hotline={chung.lienHe.hotline} />;
  return <TheoDoiDon token={token} banDau={kq.duLieu} zalo={chung.lienHe.zalo} />;
}
