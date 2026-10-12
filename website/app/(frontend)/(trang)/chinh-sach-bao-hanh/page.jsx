// Chính sách bảo hành (không có thiết kế riêng). Số tháng lấy từ Bảng giá chung (camKet), pháp nhân từ Cấu hình chung.
// NỘI DUNG PHÁP LÝ CẦN NGƯỜI CÓ THẨM QUYỀN DUYỆT trước khi lên web thật.
import Link from "next/link";
import site from "@/site.config.mjs";
import { layChung, telHref } from "@/lib/giao-dien";
import TrangVanBan from "@/components/trang/TrangVanBan";

export const metadata = {
  title: "Chính sách bảo hành",
  description: `Bảo hành phụ tùng và tiền công khi sửa ô tô tận nơi với ${site.name}: thời hạn, điều kiện, cách yêu cầu bảo hành.`,
  alternates: { canonical: "/chinh-sach-bao-hanh/" },
};

export default async function ChinhSachBaoHanh() {
  const { camKet, phapNhan, lienHe, thuongHieu } = await layChung();
  const pt = camKet.baoHanhPhuTungThang;
  const cong = camKet.baoHanhCongThang;
  const tel = telHref(lienHe.hotline);
  return (
    <TrangVanBan duongDan={[{ ten: "Chính sách bảo hành", href: "/chinh-sach-bao-hanh/" }]} tieuDe="Chính sách bảo hành">
      <p>
        Mọi việc {thuongHieu.ten} làm đều có phiếu bảo hành điện tử gửi qua Zalo sau khi bạn thanh toán. Mỗi hạng mục trên phiếu ghi rõ
        thời hạn bảo hành riêng.
      </p>
      <h2>Thời hạn bảo hành</h2>
      <dl>
        <dt>Phụ tùng thay mới</dt><dd>{pt ? `${pt} tháng` : "Theo phiếu bảo hành"} kể từ ngày thay</dd>
        <dt>Tiền công sửa chữa</dt><dd>{cong ? `${cong} tháng` : "Theo phiếu bảo hành"} kể từ ngày làm</dd>
      </dl>
      <h2>Được bảo hành khi</h2>
      <ul>
        <li>Phụ tùng do {thuongHieu.ten} cung cấp và lắp bị lỗi trong thời hạn bảo hành.</li>
        <li>Lỗi phát sinh từ chính phần việc thợ đã làm (lắp sai, siết thiếu, rò rỉ tại chỗ đã sửa…).</li>
      </ul>
      <h2>Không thuộc phạm vi bảo hành</h2>
      <ul>
        <li>Hao mòn tự nhiên theo số km sử dụng (má phanh, lốp, dầu, lọc…).</li>
        <li>Hư hỏng do va chạm, ngập nước, dùng sai cách hoặc do nơi khác sửa lại sau đó.</li>
        <li>Phụ tùng khách tự mua mang tới (chỉ bảo hành tiền công lắp).</li>
        <li>Hạng mục bạn đã từ chối trong báo giá.</li>
      </ul>
      <h2>Cách yêu cầu bảo hành</h2>
      <ol>
        <li>Gọi hotline{lienHe.hotline ? <> <a href={tel}>{lienHe.hotline}</a></> : ""} hoặc nhắn Zalo, đọc mã phiếu bảo hành (dạng BH-000123) hoặc biển số xe.</li>
        <li>Thợ tới kiểm tra tại chỗ trong vùng phục vụ. Lỗi thuộc bảo hành thì sửa, thay miễn phí, không tính phí đi lại.</li>
        <li>Việc không làm được tại chỗ, xe được đưa về {lienHe.xuongDoiTac} để xử lý theo cùng chế độ bảo hành.</li>
      </ol>
      <p>Bạn xem lại các phiếu bảo hành còn hạn của xe mình ở trang <Link href="/tra-cuu-xe/">Tra cứu lịch sử xe</Link>.</p>
      {phapNhan.ten ? (
        <p className="phu">
          Đơn vị chịu trách nhiệm bảo hành: {phapNhan.ten}{phapNhan.mst ? `, MST ${phapNhan.mst}` : ""}{phapNhan.diaChi ? `, ${phapNhan.diaChi}` : ""}.
        </p>
      ) : null}
    </TrangVanBan>
  );
}
