// 404 cho notFound() gọi từ nhóm (don) hoặc trang ngoài nhóm (trang): tự vẽ header/footer.
import Loi404 from "@/components/trang/Loi404";

export const metadata = { title: "Không tìm thấy trang", robots: { index: false, follow: true } };

export default function KhongThay() {
  return <Loi404 khung />;
}
