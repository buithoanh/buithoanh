// Chính sách bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP). Không có thiết kế riêng. Pháp nhân, liên hệ lấy từ Cấu hình chung.
// NỘI DUNG PHÁP LÝ CẦN NGƯỜI CÓ THẨM QUYỀN DUYỆT trước khi lên web thật.
import site from "@/site.config.mjs";
import { layChung, telHref } from "@/lib/giao-dien";
import TrangVanBan from "@/components/trang/TrangVanBan";

export const metadata = {
  title: "Chính sách bảo vệ dữ liệu cá nhân",
  description: `${site.name} thu thập, dùng và bảo vệ dữ liệu cá nhân của khách thế nào khi đặt lịch, gọi thợ, thanh toán.`,
  alternates: { canonical: "/chinh-sach-du-lieu/" },
};

export default async function ChinhSachDuLieu() {
  const { phapNhan, lienHe, thuongHieu } = await layChung();
  const tenDonVi = phapNhan.ten || thuongHieu.ten;
  return (
    <TrangVanBan duongDan={[{ ten: "Bảo vệ dữ liệu cá nhân", href: "/chinh-sach-du-lieu/" }]} tieuDe="Chính sách bảo vệ dữ liệu cá nhân" phu="Theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.">
      <h2>Bên kiểm soát và xử lý dữ liệu</h2>
      <p>
        {tenDonVi}{phapNhan.mst ? ` (MST ${phapNhan.mst})` : ""}{phapNhan.diaChi ? `, địa chỉ ${phapNhan.diaChi}` : ""}, đơn vị vận hành dịch vụ {thuongHieu.ten}.
      </p>
      <h2>Dữ liệu chúng tôi thu thập</h2>
      <ul>
        <li>Họ tên, số điện thoại để liên hệ và gửi tin Zalo/SMS về đơn.</li>
        <li>Địa chỉ hoặc vị trí xe để thợ tới đúng chỗ.</li>
        <li>Thông tin xe: hãng, dòng, đời, biển số; ảnh, video tình trạng xe bạn gửi.</li>
        <li>Thông tin xuất hoá đơn (tên công ty, mã số thuế, email) khi bạn yêu cầu.</li>
        <li>Số liệu truy cập không định danh (trang đã xem, nút đã bấm, nguồn quảng cáo). Chúng tôi không lưu địa chỉ IP vào số liệu.</li>
      </ul>
      <h2>Mục đích sử dụng</h2>
      <ul>
        <li>Nhận, điều phối và thực hiện đơn sửa xe; gửi báo giá, link theo dõi, hoá đơn, phiếu bảo hành.</li>
        <li>Chăm sóc sau sửa: mời đánh giá, xử lý khiếu nại, nhắc bảo dưỡng nếu bạn đồng ý.</li>
        <li>Thực hiện nghĩa vụ kế toán, thuế theo quy định.</li>
      </ul>
      <p>Chúng tôi không bán dữ liệu cá nhân. Dữ liệu chỉ chia sẻ với thợ nhận đơn, đơn vị gửi tin nhắn, hoá đơn điện tử và xưởng đối tác khi cần để làm đúng việc bạn yêu cầu.</p>
      <h2>Lưu trữ và bảo vệ</h2>
      <p>Dữ liệu lưu trên máy chủ có kiểm soát truy cập theo vai trò. Ảnh, video của đơn không công khai. Link theo dõi đơn hết hạn sau khi đơn hoàn thành. Mã xác nhận tra cứu chỉ lưu dạng mã hoá.</p>
      <h2>Quyền của bạn</h2>
      <p>Bạn có quyền được biết, đồng ý hoặc rút lại đồng ý, xem, sửa, xoá dữ liệu, hạn chế xử lý và khiếu nại. Rút lại đồng ý không ảnh hưởng tới việc đã làm trước đó.</p>
      <h2>Liên hệ</h2>
      <p>
        Gửi yêu cầu về dữ liệu cá nhân qua
        {lienHe.email ? <> email <a href={`mailto:${lienHe.email}`}>{lienHe.email}</a></> : null}
        {lienHe.email && lienHe.hotline ? " hoặc" : ""}
        {lienHe.hotline ? <> hotline <a href={telHref(lienHe.hotline)}>{lienHe.hotline}</a></> : null}.
        Chúng tôi trả lời trong thời hạn pháp luật quy định.
      </p>
    </TrangVanBan>
  );
}
