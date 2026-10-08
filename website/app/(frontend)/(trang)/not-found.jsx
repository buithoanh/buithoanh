// 404 trong nhóm trang công khai (notFound() từ trang dịch vụ, khu vực, hãng xe, cẩm nang…): header/footer do layout (trang) lo.
import Loi404 from "@/components/trang/Loi404";

export const metadata = { title: "Không tìm thấy trang", robots: { index: false, follow: true } };

export default function KhongThay() {
  return <Loi404 />;
}
