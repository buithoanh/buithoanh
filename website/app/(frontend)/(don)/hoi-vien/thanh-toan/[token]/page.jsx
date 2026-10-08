// Link riêng thanh toán gói hội viên (gửi qua Zalo sau khi đăng ký ở /hoi-vien/). Không lên Google (robots + header noindex).
import { notFound } from "next/navigation";
import { layPayload } from "@/lib/cms";
import { layChung, telHref } from "@/lib/giao-dien";
import { xemThanhToanHoiVien } from "@/lib/hoi-vien";
import Icon from "@/components/Icon";
import DauDon from "@/components/chung/DauDon";
import ThanhToanHoiVien from "@/components/p2/ThanhToanHoiVien";
import s from "./thanh-toan.module.css";

export const metadata = {
  title: "Thanh toán gói hội viên",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

async function docThanhToan(token) {
  try {
    return await xemThanhToanHoiVien(await layPayload(), token);
  } catch (e) {
    if (e?.status === 404 || e?.ma === "LINK_SAI") return null;
    throw e;
  }
}

export default async function TrangThanhToanHoiVien({ params }) {
  const { token } = await params;
  const [d, chung] = await Promise.all([docThanhToan(token), layChung()]);
  if (!d) notFound();
  const hotline = d.hotline || chung.lienHe?.hotline;
  return (
    <>
      <DauDon tieuDe={`Thanh toán gói ${d.ma}`} phu={`${d.goi} · ${d.bienSo}`} thuongHieu={chung.thuongHieu?.ten || "ThợTới"} />
      <h1 className="sr-only">Thanh toán {d.goi} cho xe {d.bienSo}</h1>
      <ThanhToanHoiVien token={token} duLieuDau={{ ...d, hotline }} telHref={telHref(hotline)} />
      <p className={s.chan}>
        <Icon name="shield" size={18} />
        <span>Link này chỉ dành cho bạn, đừng chia sẻ cho người khác. Sau khi thanh toán, hạn và lượt còn lại của gói tra lại được bằng biển số xe.</span>
      </p>
    </>
  );
}
